const config = require("./config.json");
const { Client, Intents } = require("discord.js");
const mysql = require("mysql2");
const commands = require("./commands.json");
const util = require("./util");
const stats = require("./stats");
const { runScheduledActions, validateMutes } = require("./runScheduledActions");
const { checkActiveRole } = require("./activeRole");

const bot = new Client({
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  intents: [
    Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES
  ],
  partials: ["CHANNEL"]
});

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

bot.on("ready", () => {
  const time = new Date().toLocaleString();
  console.log("FearlessBot (Taylor's Version) is ready - Started " + time);
  setInterval(function () {
    runScheduledActions(bot, db);
  }, 60000);
});

bot.on("messageCreate", (message) => {
  if (message.channel.type === "DM") {
    handleDirectMessage(message);
    return;
  }

  stats.updateUserStats(message, db);
  stats.updateChannelStats(message, db);
  checkActiveRole(message);

  if (message.content.indexOf(config.prefix) !== 0 || message.author.bot
   || !message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES")) {
    return;
  }
  const command = message.content.split(" ");
  const args = command.slice(1, command.length).join(" ");
  const commandName = command[0].toLowerCase().slice(config.prefix.length);

  if (commandName in commands) {
    if (commands[commandName].type === "dm") {
      return;
    }
    if (
      !util.hasPermission(message.member, commands[commandName].permissions)
    ) {
      return message.channel.send({
        content: ":no_entry: You do not have permission to run this command."
      });
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, args, bot, db, commands[commandName].extra);
  }
});

function handleDirectMessage(message) {
  let command = message.content.split(" ");
  let params = command.slice(1, command.length).join(" ");

  const commandName = command[0].toLowerCase().slice(config.prefix.length);
  if (commandName in commands) {
    if (commands[commandName].type === "server") {
      return;
    }
    if (
      !util.hasPermission(message.author, commands[commandName].permissions)
    ) {
      return message.channel.send({
        content: ":no_entry: You do not have permission to run this command."
      });
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, params, bot, db, commands[commandName].extra);
  }
}

bot.on("guildMemberAdd", (member) => {
  validateMutes(member, bot, db);
});

bot.on("guildMemberRemove", (member) => {
  db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [
    member.guild.id,
    member.id,
  ]);

  let joinDate = member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < 300) {
    member.guild.systemChannel.send({
      content: `${member.user.username} has already left us. :disappointed:`
    });
  }
});

bot.on("messageDelete", function (message) {
  stats.handleMessageDelete(message, db);
});

bot.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  const commandName = interaction.commandName;
  if (commandName in commands && commands[commandName].interaction) {
    if (interaction.guild === null && commands[commandName].type === "server") {
      interaction.reply("This command is not supported in DMs.");
      return;
    }
    let action = require("./commands/" + commands[commandName].action);
    action.interaction(interaction, bot, db);
  }
})

bot.login(config.token);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
