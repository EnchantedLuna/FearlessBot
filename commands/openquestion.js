const config = require("../config.json");
exports.run = function (message, params, bot, db) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [params], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (
      rows[0].user != message.author.id &&
      message.author.id != config.botAdminUserId
    ) {
      message.reply("You do not have permission to close this question.");
      return;
    }
    db.query("UPDATE trivia_questions SET isopen=1 WHERE id = ?", [params]);
    message.reply("Question #" + params + " has been opened.");
  });
};
