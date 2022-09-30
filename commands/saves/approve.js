const { log } = require("../../util");

exports.run = function (message, keyword, bot, db) {
  db.query(
    "UPDATE data_store SET approved=1, approvedby=? WHERE keyword = ? AND server = ? AND approvedby is null",
    [message.author.id, keyword, message.channel.guild.id],
    function (err, result) {
      if (result.changedRows > 0) {
        message.channel.send({
          embeds: [
            {
              description:
                ":white_check_mark: Saved item '" +
                keyword +
                "' has been approved.",
              color: 0x00ff00,
            },
          ],
        });
        log(
          message.channel.guild,
          "Saved item " +
            keyword +
            " has been approved by " +
            message.author.username
        );
      } else {
        message.channel.send({
          embeds: [
            {
              description: ":warning: Nothing to approve.",
              color: 0xffff00,
            },
          ],
        });
      }
    }
  );
};
