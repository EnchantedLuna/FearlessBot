const { isMod, log } = require("../../util");

exports.run = function (message, keyword, bot, db) {
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (
        typeof rows[0] !== "undefined" &&
        (isMod(message.member, message.channel.guild) ||
          rows[0].owner === message.author.id)
      ) {
        message.channel.send(":put_litter_in_its_place: Saved item deleted.");
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
        message.channel.send(
          ":warning: You can only delete items that you have saved."
        );
      } else {
        message.channel.send(":warning: Keyword not found.");
      }
    }
  );
};
