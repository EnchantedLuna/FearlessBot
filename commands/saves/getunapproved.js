exports.run = function (message, args, bot, db) {
  db.query(
    "SELECT * FROM data_store WHERE approved = 0 AND server = ?",
    [message.channel.guild.id],
    function (err, rows) {
      if (rows.length === 0) {
        message.channel.send("no unapproved items.");
        return;
      }

      let list = "";
      for (let i = 0; i < rows.length; i++) {
        list = list + rows[i].keyword + " ";
      }
      message.channel.send("unapproved: ``" + list + "``");
    }
  );
};
