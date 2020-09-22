const { findMemberID } = require("../util");

exports.run = function (message, params, bot, db) {
  const member = findMemberID(message, params, bot);

  db.query(
    "SELECT words, messages, username FROM members WHERE server = ? AND id = ?",
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
        message.channel.send(
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
        message.channel.send(
          ":warning: User not found. Please double check the username."
        );
      }
    }
  );
};
