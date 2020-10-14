exports.run = function (message, args, bot, db) {
  db.query("UPDATE members SET eventpoints=0 WHERE server=?", [
    message.channel.guild.id,
  ]);
  message.channel.send("Event caps have been reset.");
};
