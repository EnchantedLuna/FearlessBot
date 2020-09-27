exports.run = function (message, args, bot, db, value) {
  db.query("UPDATE channel_stats SET web=? WHERE server = ? AND channel = ?", [
    value,
    message.channel.guild.id,
    message.channel.id,
  ]);
  message.channel.send(":eye: Channel stats visibility has been updated.");
};
