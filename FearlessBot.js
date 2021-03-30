const config = require("./config.json");
const Discord = require("discord.js");
const mysql = require("mysql");

const commands = require("./commands.json");
const util = require("./util");
const stats = require("./stats");
const { runScheduledActions, validateMutes } = require("./runScheduledActions");
const { checkActiveRole } = require("./activeRole");

const bot = new Discord.Client({
  disableMentions: "everyone",
  fetchAllMembers: true,
});

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

bot.on("ready", () => {
  console.log("FearlessBot (Platinum Edition) is ready.");
  setInterval(function () {
    runScheduledActions(bot, db);
  }, 60000);
});

bot.on("message", (message) => {
  if (message.channel.type != "text") {
    handleDirectMessage(message);
    return;
  }

  stats.updateUserStats(message, db);
  stats.updateChannelStats(message, db);
  checkActiveRole(message);

  if (message.content.indexOf(config.prefix) !== 0 || message.author.bot) {
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
      message.channel.send(
        ":no_entry: You do not have permission to run this command."
      );
      return;
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
      message.channel.send(
        ":no_entry: You do not have permission to run this command."
      );
      return;
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
    member.guild.systemChannel.send(
      member.user.username + " has already left us. :disappointed:"
    );
  }
});

bot.on("messageDelete", function (message) {
  stats.handleMessageDelete(message, db);
});

bot.ws.on('INTERACTION_CREATE', async interaction => {
  if (interaction.data.name == 'song') {
    let action = require("./commands/fun/song");
    let response = action.interaction(interaction, bot, db);
    bot.api.interactions(interaction.id, interaction.token).callback.post(response);
  }
})

bot.login(config.token);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});