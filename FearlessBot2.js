const config = require("./config.json");
const Discord = require("discord.js");
const mysql = require("mysql");
const staticData = require("./staticData.json");
const commands = require("./commands.json");

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

  var command = message.content.split(" ");
  var params = command.slice(1, command.length).join(" ");

  updateUserStats(message);
  updateChannelStatsAndLog(message);

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
    // Normal user basic commands (no db)
    case "region":
    case "setregion":
      regionCommand(message, command[1]);
      break;
    // Normal user database commands
    case "g":
    case "get":
      getCommand(message, command[1], false);
      break;
    case "gmeta":
    case "getmeta":
      getMetaCommand(message, command[1]);
      break;
    case "save":
      saveCommand(message);
      break;
    case "words":
      wordsCommand(message, params);
      break;
    case "awards":
      awardsCommand(message);
      break;
    case "mods":
      modsCommand(message);
      break;
    case "answer":
      badAnswerCommand(message);
      break;
    // Mod commands
    case "approve":
      if (isMod(message.member, message.channel.guild)) {
        approveCommand(message, command[1]);
      }
      break;
    case "review":
      if (isMod(message.member, message.channel.guild)) {
        getCommand(message, command[1], true);
      }
      break;
    case "delete":
      deleteCommand(message, command[1]);
      break;
    case "getunapproved":
      if (isMod(message.member, message.channel.guild)) {
        getUnapprovedCommand(message);
      }
      break;
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
    case "unsupermute":
      if (isMod(message.member, message.channel.guild)) {
        unsupermuteCommand(message);
      }
      break;
    case "kick":
      if (isMod(message.member, message.channel.guild)) {
        kickCommand(message);
      }
      break;
    case "ban":
    case "exile":
      if (isMod(message.member, message.channel.guild)) {
        banCommand(message, parseInt(command[1]));
      }
      break;
    case "idban":
      if (isMod(message.member, message.channel.guild)) {
        idbanCommand(message, command[1]);
      }
      break;
    case "addshitpost":
      if (
        isMod(message.member, message.channel.guild) &&
        message.channel.guild.id === config.mainServer
      ) {
        addShitpostCommand(message, params);
      }
      break;
    case "addnamemix":
      if (
        isMod(message.member, message.channel.guild) &&
        message.channel.guild.id === config.mainServer
      ) {
        addNameMixCommand(message, parseInt(command[1]), command[2]);
      }
      break;
    case "award":
      if (isMod(message.member, message.channel.guild)) {
        awardCommand(message, parseInt(command[1]));
      }
      break;

    // Bot admin commands
    case "fbotrestart":
      if (message.author.id == config.botAdminUserId) {
        process.exit(-1);
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
    // trivia
    case "!question":
      newQuestionCommand(message, params);
      break;
    case "!closequestion":
      closeQuestionCommand(message, params);
      break;
    case "!answer":
      answerCommand(message);
      break;
    case "!getanswers":
      getAnswersCommand(message, params, false);
      break;
    case "!getnewanswers":
      getAnswersCommand(message, params, true);
      break;
    case "!watch":
      setWatchedCommand(message, params, 1);
      break;
    case "!unwatch":
      setWatchedCommand(message, params, 0);
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

  if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
    // To help discourage spamming for wordcount
    var removedWords = words > 20 ? Math.round(words * 1.25) : words;
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
    case "admin":
      return user.id === config.botAdminUserId;
    default:
      return false;
  }
}

function updateUserStats(message) {
  var words = message.content.replace(/\s\s+|\r?\n|\r/g, " ").split(" ").length;
  if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
    db.query(
      "INSERT INTO members (server, id, username, discriminator, lastseen, words, messages) VALUES (?,?,?,?,UNIX_TIMESTAMP(),?,1)" +
        "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), words=words+?, messages=messages+1, active=1",
      [
        message.channel.guild.id,
        message.author.id,
        message.author.username,
        message.author.discriminator,
        words,
        message.author.username,
        message.author.discriminator,
        words,
      ]
    );
  } else {
    db.query(
      "INSERT INTO members (server, id, username, discriminator, lastseen) VALUES (?,?,?,?,UNIX_TIMESTAMP())" +
        "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), active=1",
      [
        message.channel.guild.id,
        message.author.id,
        message.author.username,
        message.author.discriminator,
        message.author.username,
        message.author.discriminator,
      ]
    );
  }
}

function updateChannelStatsAndLog(message) {
  db.query(
    "INSERT INTO channel_stats (channel, server, total_messages, name, web, startdate) VALUES (?,?,1,?,0,UNIX_TIMESTAMP()) " +
      "ON DUPLICATE KEY UPDATE total_messages=total_messages+1, name=?",
    [
      message.channel.id,
      message.channel.guild.id,
      message.channel.name,
      message.channel.name,
    ]
  );

  db.query(
    "INSERT INTO user_message_stats (user, guild, channel, year, month, message_count) VALUES (?,?,?,YEAR(CURDATE()),MONTH(CURDATE()), 1) " +
      "ON DUPLICATE KEY UPDATE message_count=message_count+1",
    [message.author.id, message.channel.guild.id, message.channel.id]
  );
}

function channelCountsInStatistics(guild, channel) {
  return (
    guild != config.mainServer || config.statCountingChannels.includes(channel)
  );
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

// Database-oriented commands

function addShitpostCommand(message, shitpost) {
  db.query(
    "INSERT INTO shitposts (shitpost, addedby, addedon) VALUES (?,?,now())",
    [shitpost, message.author.id],
    function (err, result) {
      message.reply("added #" + result.insertId + ".");
      log(
        message.channel.guild,
        "New Shitpost #" +
          result.insertId +
          " added by " +
          message.author.username +
          ": " +
          shitpost
      );
    }
  );
}

function addNameMixCommand(message, part, namePiece) {
  if ((part !== 1 && part !== 2) || namePiece === null) {
    message.reply("invalid part. usage: ``!namemix [1,2] [name piece]``");
    return;
  }

  db.query(
    "INSERT INTO namemix (name_piece, part, addedby, addedon) VALUES (?,?,?,now())",
    [namePiece, part, message.author.id]
  );
  message.reply("added!");
}

function wordsCommand(message, params) {
  var member;
  if (message.mentions.members.size > 0) {
    member = message.mentions.members.first().user.username;
  } else if (params != "") {
    member = params;
  } else {
    member = message.author.username;
  }

  db.query(
    "SELECT words, messages, username FROM members WHERE server = ? AND username = ?",
    [message.channel.guild.id, member],
    function (err, rows) {
      if (err != null) {
        console.log(err);
        return;
      }
      if (rows[0] != null) {
        var average =
          rows[0].messages > 0
            ? Math.round((rows[0].words / rows[0].messages) * 100) / 100
            : 0;
        message.reply(
          rows[0].username +
            " has used " +
            rows[0].words +
            " words in " +
            rows[0].messages +
            " messages, an average of " +
            average +
            " words per message."
        );
      } else {
        message.reply("user not found. Please double check the username.");
      }
    }
  );
}

function awardsCommand(message) {
  let member;
  if (message.mentions.members.size > 0) {
    member = message.mentions.members.first().user;
  } else {
    member = message.author;
  }

  db.query(
    "SELECT * FROM awards WHERE server = ? AND member = ? ORDER BY date, id",
    [message.channel.guild.id, member.id],
    function (err, rows) {
      if (err != null) {
        console.log(err);
        return;
      }
      if (rows[0] != null) {
        let awardsText = "\nAwards for " + member.username + ":\n";
        for (let i = 0; i < rows.length; i++) {
          let date = rows[i].date.toDateString();
          awardsText += i + 1 + ". " + rows[i].award + " [" + date + "]\n";
        }
        message.reply(awardsText);
      } else {
        message.reply("no awards :(");
      }
    }
  );
}

function getCommand(message, keyword, showUnapproved) {
  if (keyword == null) return;
  let author = message.author.tag;
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (rows[0] == null) {
        message.channel.send("", {
          embed: {
            title: keyword + " (requested by " + author + ")",
            description:
              ":warning: Nothing is stored for keyword " + keyword + ".",
          },
        });
      } else if (!rows[0].approved && !showUnapproved) {
        message.channel.send("", {
          embed: {
            title: keyword + " (requested by " + author + ")",
            description: ":warning: This item has not been approved yet.",
          },
        });
      } else {
        let text = rows[0]["value"];
        if (text.match("^(http(s?):)([/|.|\\w|\\s|-])*\\.(?:jpg|gif|png)$")) {
          let date = "Created: ";
          if (rows[0].timeadded !== null) {
            date += rows[0].timeadded.toDateString();
          } else {
            date += "a long time ago";
          }
          message.channel.send("", {
            embed: {
              title: keyword + " (requested by " + author + ")",
              image: { url: text },
              footer: { text: date },
            },
          });
        } else {
          message.reply(text);
        }
        if (
          channelCountsInStatistics(
            message.channel.guild.id,
            message.channel.id
          )
        ) {
          db.query(
            "UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?",
            [keyword, message.channel.guild.id]
          );
        }
      }
    }
  );
}

function getMetaCommand(message, keyword) {
  if (keyword == null) return;
  db.query(
    "SELECT keyword, value, uses, saver.username AS username, approver.username AS approver, lastused, approved, timeadded \
            FROM data_store \
            LEFT JOIN members saver ON data_store.owner=saver.id AND data_store.server=saver.server \
            LEFT JOIN members approver ON data_store.approvedby=approver.id AND data_store.server=approver.server \
            WHERE data_store.server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (rows[0] == null) {
        message.reply("nothing is stored for keyword " + keyword + ".");
      } else if (!rows[0].approved) {
        message.reply("this item has not been approved yet.");
      } else {
        var lastused = rows[0].lastused !== null ? rows[0].lastused : "never";
        var timeadded =
          rows[0].timeadded !== null
            ? "\nTime added: " + rows[0].timeadded
            : "";
        var approver =
          rows[0].approver !== null ? "\nApproved by: " + rows[0].approver : "";
        message.reply(
          rows[0].value +
            "\nUses: " +
            rows[0].uses +
            "\nLast used: " +
            lastused +
            "\nSaved by: " +
            rows[0].username +
            timeadded +
            approver
        );
      }
    }
  );
}

function saveCommand(message) {
  var command = message.content.split(" ");
  if (command[1] == null) return;
  if (command[1].startsWith("http")) {
    message.reply(
      "you probably dun goof'd your command. The keyword comes first!"
    );
    return;
  }
  if (command[2] == null) {
    message.reply(
      "you need to specify a value (the thing you want saved) for that keyword."
    );
    return;
  }

  var key = command[1];
  var value = command.slice(2, command.length).join(" ");
  // check for existing
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, key],
    function (err, rows) {
      if (
        (isMod(message.member, message.channel.guild) ||
          message.channel.guild.id != config.mainServer) &&
        (rows[0] == null || rows[0]["owner"] == message.author.id)
      ) {
        db.query(
          "REPLACE INTO data_store (server, keyword, value, owner, approved, timeadded, approvedby) VALUES (?,?,?,?,1,now(),?)",
          [
            message.channel.guild.id,
            key,
            value,
            message.author.id,
            message.author.id,
          ]
        );
        message.reply("updated and ready to use.");
        log(
          message.channel.guild,
          message.author.username +
            " created item " +
            key +
            " - auto approved\nValue: " +
            value
        );
      } else if (rows[0] == null) {
        db.query(
          "INSERT INTO data_store (server, keyword, value, owner, timeadded) VALUES (?,?,?,?,now())",
          [message.channel.guild.id, key, value, message.author.id]
        );
        message.reply(
          "created. This will need to be approved before it can be used."
        );
        log(
          message.channel.guild,
          message.author.username +
            " created item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else if (rows[0]["owner"] == message.author.id) {
        db.query(
          "UPDATE data_store SET value = ?, approved=0, timeadded=now(), approvedby=null WHERE keyword = ? AND server = ?",
          [value, key, message.channel.guild.id]
        );
        message.reply(
          "updated. This will need to be approved before it can be used."
        );
        log(
          message.channel.guild,
          message.author.username +
            " updated item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else {
        message.reply("this keyword already exists.");
      }
    }
  );
}

function approveCommand(message, keyword) {
  db.query(
    "UPDATE data_store SET approved=1, approvedby=? WHERE keyword = ? AND server = ? AND approvedby is null",
    [message.author.id, keyword, message.channel.guild.id],
    function (err, result) {
      if (result.changedRows > 0) {
        message.channel.send("", {
          embed: {
            description:
              ":white_check_mark: Saved item '" +
              keyword +
              "' has been approved.",
            color: 0x00ff00,
          },
        });
        log(
          message.channel.guild,
          "Saved item " +
            keyword +
            " has been approved by " +
            message.author.username
        );
      } else {
        message.channel.send("", {
          embed: {
            description: ":warning: Nothing to approve.",
            color: 0xffff00,
          },
        });
      }
    }
  );
}

function deleteCommand(message, keyword) {
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (
        typeof rows[0] !== "undefined" &&
        (isMod(message.member, message.channel.guild) ||
          rows[0].owner === message.author.id)
      ) {
        message.reply("deleted.");
        db.query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [
          message.channel.guild.id,
          keyword,
        ]);
        log(
          message.channel.guild,
          "Saved item " +
            keyword +
            " has been deleted by " +
            message.author.username
        );
      } else if (typeof rows[0] !== "undefined") {
        message.reply("you can only delete items that you have saved.");
      } else {
        message.reply("keyword not found.");
      }
    }
  );
}

function getUnapprovedCommand(message) {
  db.query(
    "SELECT * FROM data_store WHERE approved = 0 AND server = ?",
    [message.channel.guild.id],
    function (err, rows) {
      if (rows.length == 0) {
        message.reply("no unapproved items.");
        return;
      }

      var list = "";
      for (var i = 0; i < rows.length; i++) {
        list = list + rows[i].keyword + " ";
      }
      message.reply("unapproved: ``" + list + "``");
    }
  );
}

// Guild property commands (roles, permissions, etc)

function regionCommand(message, region) {
  var northamerica = message.channel.guild.roles.cache.find(
    (role) => role.name === "northamerica"
  );
  var southamerica = message.channel.guild.roles.cache.find(
    (role) => role.name === "southamerica"
  );
  var europe = message.channel.guild.roles.cache.find(
    (role) => role.name === "europe"
  );
  var asia = message.channel.guild.roles.cache.find(
    (role) => role.name === "asia"
  );
  var africa = message.channel.guild.roles.cache.find(
    (role) => role.name === "africa"
  );
  var oceania = message.channel.guild.roles.cache.find(
    (role) => role.name === "oceania"
  );
  var allRegions = [northamerica, southamerica, europe, asia, africa, oceania];

  if (typeof region == "undefined") {
    message.reply(
      "please specify a region. Available regions are northamerica, " +
        "southamerica, europe, asia, africa, and oceania. Example: ``!setregion europe``"
    );
    return;
  }

  switch (region.toLowerCase()) {
    case "clear":
      message.member.roles.remove(allRegions);
      message.reply("your region has been cleared.");
      break;
    case "america":
    case "northamerica":
      arrayRemove(allRegions, northamerica);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(northamerica));
      message.reply("your region has been set to North America.");
      break;
    case "southamerica":
      arrayRemove(allRegions, southamerica);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(southamerica));
      message.reply("your region has been set to South America.");
      break;
    case "europe":
      arrayRemove(allRegions, europe);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(europe));
      message.reply("your region has been set to Europe.");
      break;
    case "asia":
      arrayRemove(allRegions, asia);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(asia));
      message.reply("your region has been set to Asia.");
      break;
    case "africa":
      arrayRemove(allRegions, africa);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(africa));
      message.reply("your region has been set to Africa.");
      break;
    case "oceania":
      arrayRemove(allRegions, oceania);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(oceania));
      message.reply("your region has been set to Oceania.");
      break;
    default:
      message.reply(
        "region not recognized. Acceptable values: northamerica, southamerica, europe, asia, africa, oceania, clear."
      );
      break;
  }
}

function modsCommand(message) {
  let mods = message.channel.guild.roles.cache.find(
    (role) => role.name === "mods"
  );
  if (mods === "undefined") {
    return;
  }
  let joinDate = message.member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < 60 * 60 * 24 * 14) {
    message.reply(
      "this command can only be used by members who have joined more than 2 weeks ago."
    );
    return;
  }

  mods.setMentionable(true, "activated by " + message.author.username);
  log(
    message.channel.guild,
    "Mods tag activated by " + message.author.username
  );
  message.reply(
    "the mods tag has activated. Do not continue if this is not a serious issue that needs attention and no mods are currently active. " +
      "Otherwise, use the tag quickly, as it will be disabled in 2 minutes."
  );
  setTimeout(function () {
    mods.setMentionable(false);
    log(message.channel.guild, "Mods tag deactivated.");
  }, 120000);
}

function arrayRemove(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
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

function unsupermuteCommand(message) {
  var supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      member.roles.remove(supermute);
      message.reply(member.user.username + " has been un-supermuted.");
    }
  });
}

function kickCommand(message) {
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      var reason = message.cleanContent.replace("!kick ", "");
      member.kick(reason);
      message.reply(member.user.username + " has been kicked.");
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

function idbanCommand(message, userId) {
  if (isMod(userId, message.channel.guild)) {
    message.reply(":smirk:");
  } else {
    message.channel.guild.members.ban(userId).then((user) => {
      message.channel.send("", {
        embed: {
          description: `:hammer: Banned ${user.username || user.id || user}.`,
        },
      });
    });
  }
}

function awardCommand(message, number) {
  let list = [];
  message.mentions.members.forEach(function (member, key, map) {
    db.query(
      "UPDATE members SET lorpoints=lorpoints+? WHERE server = ? AND id = ?",
      [number, message.channel.guild.id, member.id]
    );
    list.push(member.user.username);
  });
  let finalList = list.join(", ");
  let lorpointWord = number !== 1 ? "lorpoints" : "lorpoint";
  message.reply(
    number + " " + lorpointWord + " have been awarded to: " + finalList
  );
  log(
    message.channel.guild,
    number +
      " " +
      lorpointWord +
      " have been awarded to: " +
      finalList +
      " by " +
      message.author.username
  );
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

function newQuestionCommand(message, params) {
  if (params == "") {
    message.reply("Please enter a question, e.g. ``!question Is butt legs?``");
    return;
  }
  db.query(
    "INSERT INTO trivia_questions (user, question, timecreated) VALUES (?, ?, now())",
    [message.author.id, params],
    function (err, result) {
      message.reply("Question #" + result.insertId + " has been registered.");
    }
  );
}

function closeQuestionCommand(message, params) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [params], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (
      rows[0].user != message.author.id &&
      message.author.id != config.botAdminUserId
    ) {
      message.reply("You do not have permission to close this question.");
      return;
    }
    db.query("UPDATE trivia_questions SET isopen=0 WHERE id = ?", [params]);
    message.reply("Question #" + params + " has been closed.");
  });
}

function getAnswersCommand(message, params, showOnlyNew) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [params], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (
      rows[0].user != message.author.id &&
      message.author.id != config.botAdminUserId
    ) {
      message.reply("You do not have permission to view these answers.");
      return;
    }
    getAnswerList(message, rows[0], showOnlyNew);
  });
}

function setWatchedCommand(message, params, watched) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [params], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (rows[0].user != message.author.id) {
      message.reply("You do not have permission to update this.");
      return;
    }
    db.query("UPDATE trivia_questions SET watched = ? WHERE id = ?", [
      watched,
      params,
    ]);
    let response = watched
      ? "This question is now watched."
      : "This question is now unwatched.";
    message.reply(response);
  });
}

function getAnswerList(message, questionRow, showOnlyNew) {
  let id = questionRow.id;
  let question = questionRow.question;
  let questionAsker = questionRow.user;
  let query =
    "SELECT user, answer FROM trivia_answers WHERE questionid = ? ORDER BY id";
  if (showOnlyNew) {
    query =
      "SELECT user, answer FROM trivia_answers WHERE questionid = ? AND viewed = 0 ORDER BY id";
  }
  db.query(query, [id], function (err, rows) {
    let response = "__Answers for question #" + id + ": " + question + "__\n";
    let userList = [];
    for (var i = 0; i < rows.length; i++) {
      let answer = rows[i].answer;
      let user = bot.users.resolve(rows[i].user);
      let username = "@" + user.tag;
      let answerEntry = "**" + username + "**\n" + answer + "\n\n";
      response += answerEntry;
      userList.push(username);
    }
    let mainServer = bot.guilds.cache.get(config.mainServer);
    if (
      typeof mainServer !== "undefined" &&
      isMod(message.author.id, mainServer)
    ) {
      response +=
        "Award all command: ```\n!award 1 " + userList.join(" ") + "```";
    }
    if (message.author.id == questionAsker) {
      db.query("UPDATE trivia_answers SET viewed=1 WHERE questionid = ?", [id]);
    }

    message.reply(response, { split: true });
  });
}
