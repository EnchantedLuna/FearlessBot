const config = require("./config.json");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const mysql = require("mysql2");
const commands = require("./commands.json");
const util = require("./util");
const stats = require("./stats");
const { runScheduledActions, validateMutes } = require("./runScheduledActions");
const { checkActiveRole } = require("./activeRole");
const directMessagePrefix = "!";

const bot = new Client({
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
  timezone: "Z",
});

bot.on("ready", () => {
  const time = new Date().toLocaleString();
  console.log("FearlessBot (Taylor's Version) is ready - Started " + time);
  setInterval(function () {
    runScheduledActions(bot, db);
  }, 60000);
});

bot.on("messageCreate", async (message) => {
  if (message.channel.type === ChannelType.DM) {
    handleDirectMessage(message);
    return;
  }
  const prefix = await util.getGuildConfig(
    message.channel.guild.id,
    "prefix",
    db
  );

  stats.updateUserStats(message, db);
  stats.updateChannelStats(message, db);
  checkActiveRole(message, message.channel.guild.id, db);

  if (
    message.content.indexOf(prefix) !== 0 ||
    message.author.bot ||
    !message.channel
      .permissionsFor(message.guild.members.me)
      .has(PermissionsBitField.Flags.SendMessages)
  ) {
    return;
  }
  const command = message.content.split(" ");
  const args = command.slice(1, command.length).join(" ");
  const commandName = command[0].toLowerCase().slice(prefix.length);

  if (commandName in commands) {
    if (
      commands[commandName].type === "dm" ||
      commands[commandName].type === "slash"
    ) {
      return;
    }
    if (
      !util.hasPermission(message.member, commands[commandName].permissions)
    ) {
      return message.channel.send({
        content: ":no_entry: You do not have permission to run this command.",
      });
    }
    if (
      await util.isCommandBlocked(
        message.channel.guild.id,
        message.channel.id,
        db,
        commandName
      )
    ) {
      return message.channel.send({
        content: ":no_entry: This command is blocked in this channel.",
      });
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, args, bot, db, commands[commandName].extra);
  }
});

function handleDirectMessage(message) {
  let command = message.content.split(" ");
  let params = command.slice(1, command.length).join(" ");

  const commandName = command[0]
    .toLowerCase()
    .slice(directMessagePrefix.length);
  if (commandName in commands) {
    if (
      commands[commandName].type === "server" ||
      commands[commandName].type === "slash"
    ) {
      return;
    }
    if (
      !util.hasPermission(message.author, commands[commandName].permissions)
    ) {
      return message.channel.send({
        content: ":no_entry: You do not have permission to run this command.",
      });
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, params, bot, db, commands[commandName].extra);
  }
}

bot.on("guildMemberAdd", (member) => {
  validateMutes(member, bot, db);
});

bot.on("guildMemberRemove", async (member) => {
  db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [
    member.guild.id,
    member.id,
  ]);

  const leaveMessageThreshold = await util.getGuildConfig(
    member.guild.id,
    "leave-threshold",
    db
  );

  if (leaveMessageThreshold < 1) {
    return;
  }

  let joinDate = member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < leaveMessageThreshold * 60) {
    member.guild.systemChannel.send({
      content: `${member.user.username} has already left us. :disappointed:`,
    });
  }
});

bot.on("messageDelete", function (message) {
  stats.handleMessageDelete(message, db);
});

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const commandName = interaction.commandName;
  if (commandName in commands && commands[commandName].interaction) {
    if (interaction.guild === null && commands[commandName].type === "server") {
      interaction.reply("This command is not supported in DMs.");
      return;
    }
    const subCommand = interaction.options.getSubcommand(false);
    const actionPath = subCommand
      ? commands[commandName]["subcommands"][subCommand].action
      : commands[commandName].action;
    let action = require("./commands/" + actionPath);
    action.interaction(interaction, bot, db);
  }
});

bot.login(config.token);

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
