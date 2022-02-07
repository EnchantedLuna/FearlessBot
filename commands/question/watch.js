exports.run = function (message, args, bot, db, watched) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [args], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (rows[0].user !== message.author.id) {
      message.reply("You do not have permission to update this.");
      return;
    }
    db.query("UPDATE trivia_questions SET watched = ? WHERE id = ?", [
      watched,
      args,
    ]);
    let response = watched
      ? "This question is now watched."
      : "This question is now unwatched.";
    message.reply(response);
  });
};
