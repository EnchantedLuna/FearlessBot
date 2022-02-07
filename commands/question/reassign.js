exports.run = async function (message, args, bot, db) {
  const arg = args.split(" ");
  const questionId = arg[0];
  const userId = arg[1];

  if (!questionId || !userId) {
    message.reply("Usage: ``!reassign [question] [new user id]``");
    return;
  }

  const user = await bot.users.fetch(userId);
  if (!user) {
    message.reply("User not found");
    return;
  }

  db.query(
    "UPDATE trivia_questions SET user=?, watched=0 WHERE id=?",
    [userId, questionId],
    function (err, result) {
      if (err) {
        console.log(err);
        return;
      }
      const response =
        result.changedRows > 0
          ? "Question " + questionId + " has been reassigned to " + user.tag
          : "No changes made.";
      message.reply(response);
    }
  );
};
