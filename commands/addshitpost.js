const { log } = require("../util");

exports.run = function (message, shitpost, bot, db) {
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
};
