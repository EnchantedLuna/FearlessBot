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

const bot = new Client({
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
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

bot.on("clientReady", () => {
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
    db,
  );

  stats.updateUserStats(message, db);
  stats.updateChannelStats(message, db);
  checkActiveRole(message, message.channel.guild.id, db);

  // This section is for dealing with ping replies to the first message in the Taylor server ("Taylor is pretty cool I guess")
  // This is definitely not needed if you're using this for another server.
  if (message.reference?.messageId == config.firstMessageId) {
    const hasPingOn = message.mentions.has(config.botAdminUserId);
    if (hasPingOn) {
      if (config.firstMessageReplyAllowedUsers.includes(message.member.id)) {
        message.reply(config.juliaMessage);
      } else {
        message.reply(
          'Did you read the part in that message that says "Do not ping reply to this message" in all caps? Now go stand in the corner and think about what you did.',
        );
        try {
          const timeoutInterval = 4380 * 1000; // 1 hour 13 minutes
          message.member.timeout(
            timeoutInterval,
            "Ping replying to the first message",
          );
        } catch (e) {
          console.log("Failed to punish for pinging first message");
        }
      }
    }
  }
});

bot.on("messageDelete", function (message) {
  stats.handleMessageDelete(message, db);
});

bot.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    let action = require("./commands/saves/save-modal"); // the only modal action for now
    action.handleModalResponse(interaction, bot, db);
  }
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
