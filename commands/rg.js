exports.run = function (message, args, bot, db) {
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND approved = 1 ORDER BY RAND() LIMIT 1",
    [message.channel.guild.id],
    function (err, rows) {
      if (rows) {
        message.reply(rows[0]["keyword"] + ": " + rows[0]["value"]);
      }
    }
  );
};
