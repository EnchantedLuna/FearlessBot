const { channelCountsInStatistics } = require("./util");
const config = require("./config.json");
const { ChannelType } = require("discord.js");

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

exports.updateUserStats = async function (message, db) {
  const countStats = await channelCountsInStatistics(
    message.channel.guild.id,
    message.channel.id,
    db
  );
  if (countStats) {
    db.query(
      "INSERT INTO members (server, id, username, lastseen, messages) VALUES (?,?,?,UNIX_TIMESTAMP(),1)" +
        "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP(), messages=messages+1, active=1",
      [
        message.channel.guild.id,
        message.author.id,
        message.author.username,
        message.author.username,
      ]
    );
  } else {
    db.query(
      "INSERT INTO members (server, id, username, lastseen) VALUES (?,?,?,UNIX_TIMESTAMP())" +
        "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP(), active=1",
      [
        message.channel.guild.id,
        message.author.id,
        message.author.username,
        message.author.username,
      ]
    );
  }
};

exports.handleMessageDelete = function (message, db) {
  if (!message.channel.type === ChannelType.GuildText) {
    return;
  }

  db.query(
    "UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?",
    [message.channel.id]
  );
};
