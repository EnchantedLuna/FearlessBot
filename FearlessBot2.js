const config = require("./config.json");
const Discord = require("discord.js");
const mysql = require("mysql");

const commands = require("./commands.json");
const util = require("./util");
const stats = require("./stats");

const TWELVE_HOURS = 43200000;

var bot = new Discord.Client({ disableEveryone: true, fetchAllMembers: true });

var db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

bot.on("ready", () => {
  console.log("FearlessBot2 is ready.");
  setInterval(runScheduledActions, 60000);
});

function runScheduledActions() {
  db.query(
    "SELECT scheduled_actions.*, members.username FROM scheduled_actions \
    JOIN members ON members.server=scheduled_actions.guild AND scheduled_actions.user=members.id \
    WHERE completed=0 AND effectivetime < NOW() ORDER BY id",
    [],
    function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        var guild = bot.guilds.cache.get(rows[i].guild);
        if (typeof guild == "undefined") {
          console.log(
            "Scheduled actions: Guild " + rows[i].guild + " not found."
          );
          continue;
        }
        switch (rows[i].action) {
          case "unmute":
            var supermute = guild.roles.cache.find(
              (role) => role.name === "supermute"
            );
            if (typeof supermute == "undefined") {
              console.log(
                "Scheduled actions: Supermute role not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            var member = guild.members.cache.get(rows[i].user);
            if (typeof member == "undefined") {
              util.log(
                guild,
                "Warning: " +
                  rows[i].username +
                  " was scheduled to be unmuted, but this member was not found. Have they left?"
              );
              db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
                rows[i].id,
              ]);
              continue;
            }
            member.roles.remove(supermute);
            util.log(guild, member.user.username + "'s supermute has expired.");
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            break;
          case "unbowlmute":
            let bowlmute = guild.roles.cache.find(
              (role) => role.name === "bowlmute"
            );
            if (typeof bowlmute == "undefined") {
              console.log(
                "Scheduled actions: Bowl mute role not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            var member = guild.members.cache.get(rows[i].user);
            if (typeof member == "undefined") {
              util.log(
                guild,
                "Warning: " +
                  rows[i].username +
                  " was scheduled to be unmuted for bowls, but this member was not found. Have they left?"
              );
              db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
                rows[i].id,
              ]);
              continue;
            }
            member.roles.remove(bowlmute);
            util.log(guild, member.user.username + "'s bowl mute has expired.");
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            break;
          case "unban":
            guild.members.unban(rows[i].user);
            util.log(guild, rows[i].username + "'s ban has expired.");
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            break;
        }
      }
    }
  );
}

bot.on("message", (message) => {
  if (message.channel.type != "text") {
    handleDirectMessage(message);
    return;
  }

  let command = message.content.split(" ");
  let params = command.slice(1, command.length).join(" ");

  stats.updateUserStats(message, db);
  stats.updateChannelStats(message, db);

  if (
    message.channel.guild.id == config.mainServer &&
    !hasRole(message.member, message.channel.guild, "active")
  ) {
    let joinDate = message.member.joinedAt;
    let now = new Date();
    let joinTime = now.getTime() - joinDate.getTime();
    if (joinTime > TWELVE_HOURS) {
      let role = message.channel.guild.roles.cache.find(
        (role) => role.name === "active"
      );
      message.member.roles.add(role);
    }
  }

  if (message.content.indexOf(config.prefix) !== 0) {
    return;
  }
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
    action.run(message, params, bot, db, commands[commandName].extra);
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

bot.on("messageDelete", (message) => {
  if (
    message.channel.type != "text" ||
    (message.author.id === config.botAdminUserId &&
      message.content.startsWith("!fsay"))
  ) {
    return;
  }

  let words = message.content.replace(/\s\s+|\r?\n|\r/g, " ").split(" ").length;

  if (
    util.channelCountsInStatistics(message.channel.guild.id, message.channel.id)
  ) {
    db.query(
      "UPDATE members SET words=words-?, messages=messages-1 WHERE id=? AND server=?",
      [words, message.author.id, message.channel.guild.id]
    );
  }

  db.query(
    "UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?",
    [message.channel.id]
  );
});

bot.login(config.token);

function hasRole(member, guild, roleName) {
  let role = guild.roles.cache.find((role) => role.name === roleName);
  if (role === null) {
    return false;
  }

  return member.roles.cache.some((memberRole) => memberRole.id === role.id);
}
