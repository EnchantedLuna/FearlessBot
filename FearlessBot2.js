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
              log(
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
            log(guild, member.user.username + "'s supermute has expired.");
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
              log(
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
            log(guild, member.user.username + "'s bowl mute has expired.");
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            break;
          case "unban":
            guild.members.unban(rows[i].user);
            log(guild, rows[i].username + "'s ban has expired.");
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
    if (!hasPermission(message.member, commands[commandName].permissions)) {
      message.reply("you do not have permission to run this command.");
      return;
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, params, bot, db, commands[commandName].extra);
    return;
  }

  switch (commandName) {
    case "answer":
      badAnswerCommand(message);
      break;
    // Mod commands
    case "bowlmute":
      if (isMod(message.member, message.channel.guild)) {
        bowlmuteCommand(message, parseInt(command[1]));
      }
      break;
    case "supermute":
    case "hush":
      if (isMod(message.member, message.channel.guild)) {
        supermuteCommand(message, parseInt(command[1]));
      }
      break;
    case "ban":
    case "exile":
      if (isMod(message.member, message.channel.guild)) {
        banCommand(message, parseInt(command[1]));
      }
      break;
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
    if (!hasPermission(message.author, commands[commandName].permissions)) {
      message.reply("You do not have permission to run this command.");
      return;
    }
    let action = require("./commands/" + commands[commandName].action);
    action.run(message, params, bot, db, commands[commandName].extra);
    return;
  }

  switch (command[0].toLowerCase()) {
    case "!answer":
      answerCommand(message);
      break;
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
  if (message.channel.type != "text") {
    return;
  }

  if (
    message.author.id === config.botAdminUserId &&
    message.content.startsWith("!fsay")
  ) {
    return;
  }

  var words = message.content.replace(/\s\s+|\r?\n|\r/g, " ").split(" ").length;

  if (
    util.channelCountsInStatistics(message.channel.guild.id, message.channel.id)
  ) {
    db.query(
      "UPDATE members SET words=words-?, messages=messages-1 WHERE id=? AND server=?",
      [removedWords, message.author.id, message.channel.guild.id]
    );
  }

  db.query(
    "UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?",
    [words, message.channel.id]
  );
});

bot.login(config.token);

function hasPermission(user, permission) {
  switch (permission) {
    case "all":
      return true;
    case "mods":
      return util.isMod(user, user.guild);
    case "mainServerMods":
      return (
        util.isMod(user, user.guild) && user.guild.id === config.mainServer
      );
    case "admin":
      return user.id === config.botAdminUserId;
    default:
      return false;
  }
}

function isMod(member, guild) {
  if (typeof member === "string") {
    member = guild.members.cache.get(member);
    if (typeof member === "undefined") {
      return false;
    }
  }
  return hasRole(member, guild, "mods") || member.id == config.botAdminUserId;
}

function hasRole(member, guild, roleName) {
  let role = guild.roles.cache.find((role) => role.name === roleName);
  if (role === null) {
    return false;
  }

  return member.roles.cache.some((memberRole) => memberRole.id === role.id);
}

function log(guild, message) {
  let logChannel = guild.channels.cache.find(
    (channel) => channel.name === "log"
  );
  if (logChannel) {
    logChannel.send(message);
  }
}

function supermuteCommand(message, hours) {
  let supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  let active = message.channel.guild.roles.cache.find(
    (role) => role.name === "active"
  );
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      member.roles.add(supermute);
      member.roles.remove(active);
      var timeMessage = "";
      if (hours > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) VALUES ('unmute', ?, ?, NOW() + INTERVAL ? HOUR)",
          [message.channel.guild.id, member.user.id, hours]
        );
        timeMessage = " for " + hours + " hour";
        timeMessage += hours != 1 ? "s" : "";
      }
      message.reply(
        member.user.username + " has been supermuted" + timeMessage + "."
      );
    }
  });
}

function bowlmuteCommand(message, hours) {
  let bowlMute = message.channel.guild.roles.cache.find(
    (role) => role.name === "bowlmute"
  );
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      member.roles.add(bowlMute);
      var timeMessage = "";
      if (hours > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) VALUES ('unbowlmute', ?, ?, NOW() + INTERVAL ? HOUR)",
          [message.channel.guild.id, member.user.id, hours]
        );
        timeMessage = " for " + hours + " hour";
        timeMessage += hours != 1 ? "s" : "";
      }
      message.reply(
        member.user.username + " has been bowl muted" + timeMessage + "."
      );
    }
  });
}

function banCommand(message, days) {
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      var reason = message.cleanContent.replace("!ban ", "");
      member.ban(reason);
      message.channel.send("", {
        embed: {
          description: ":hammer: " + member.user.username + " has been banned.",
        },
      });
      var timeMessage = "indefinitely";
      if (days > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) \
                VALUES ('unban', ?, ?, NOW() + INTERVAL ? DAY)",
          [message.channel.guild.id, member.user.id, days]
        );
        timeMessage = "for " + days + " day";
        timeMessage += days != 1 ? "s" : "";
      }
      log(
        message.channel.guild,
        member.user.username +
          " has been banned " +
          timeMessage +
          " by " +
          message.author.username
      );
    }
  });
}

// Trivia

function badAnswerCommand(message) {
  message.reply("answer only in my DMs!");
  message.delete();
}

function answerCommand(message, params) {
  let command = message.content.split(" ");
  let question = command[1];
  let answer = command.slice(2, command.length).join(" ");
  message.attachments.each(
    (attachment) => (answer += "\n<" + attachment.url + ">")
  );
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [question], function (
    err,
    questionRow
  ) {
    if (questionRow[0] == null || questionRow[0].id != question) {
      message.reply("That question id is invalid. Please try again.");
      return;
    }
    if (!questionRow[0].isopen) {
      message.reply(
        "Question #" + questionRow[0].id + " is no longer taking answers."
      );
      return;
    }
    db.query(
      "SELECT * FROM trivia_answers WHERE user = ? AND questionid = ?",
      [message.author.id, question],
      function (err, rows) {
        if (rows.length == 0) {
          db.query(
            "INSERT INTO trivia_answers (user, questionid, answer, time) VALUES (?,?,?,now())",
            [message.author.id, question, answer]
          );
          message.reply(
            "Your answer to question #" +
              question +
              " (" +
              questionRow[0].question +
              ") has been submitted. Thank you!"
          );
          if (questionRow[0].watched) {
            bot.users.cache
              .get(questionRow[0].user)
              .send(
                "**New answer for question #" +
                  question +
                  " from " +
                  message.author.tag +
                  "**\n" +
                  answer
              );
          }
        } else {
          db.query(
            "UPDATE trivia_answers SET answer = ?, time=now(), viewed=0 WHERE user = ? AND questionid = ?",
            [answer, message.author.id, question]
          );
          message.reply(
            "Your answer to question #" +
              question +
              " (" +
              questionRow[0].question +
              ") has been updated, replacing your previous answer (" +
              rows[0].answer +
              "). Thank you!"
          );
          if (questionRow[0].watched) {
            bot.users.cache
              .get(questionRow[0].user)
              .send(
                "**Edited answer for question #" +
                  question +
                  " from " +
                  message.author.tag +
                  "**\n" +
                  answer
              );
          }
        }
      }
    );
  });
}
