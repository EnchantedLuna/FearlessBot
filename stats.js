const { channelCountsInStatistics } = require("./util");
const config = require("./config.json");

exports.updateChannelStats = function (message, db) {
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
};

exports.updateUserStats = function (message, db) {
  let words = message.content.replace(/\s\s+|\r?\n|\r/g, " ").split(" ").length;
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
};

exports.handleMessageDelete = function (message) {
  if (
    message.channel.type != "text" ||
    (message.author.id === config.botAdminUserId &&
      message.content.startsWith("!fsay"))
  ) {
    return;
  }

  let words = message.content.replace(/\s\s+|\r?\n|\r/g, " ").split(" ").length;

  if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
    db.query(
      "UPDATE members SET words=words-?, messages=messages-1 WHERE id=? AND server=?",
      [words, message.author.id, message.channel.guild.id]
    );
  }

  db.query(
    "UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?",
    [message.channel.id]
  );
  console.log("delete");
};
