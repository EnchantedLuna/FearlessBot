async function setWatched(user, questionId, status, db) {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM trivia_questions WHERE id = ?", [questionId]);
  if (rows[0] == null) {
    return "This question id does not exist.";
  }
  if (rows[0].user !== user.id) {
    return "This is not your question.";
  }
  await db
    .promise()
    .query("UPDATE trivia_questions SET watched = ? WHERE id = ?", [
      status,
      questionId,
    ]);
  let response = status
    ? "This question is now watched."
    : "This question is now unwatched.";
  return response;
}

exports.interaction = async function (interaction, bot, db) {
  const questionId = interaction.options.getInteger("id");
  const watched = interaction.options.getInteger("status");
  interaction.reply(
    await setWatched(interaction.user, questionId, watched, db)
  );
};
