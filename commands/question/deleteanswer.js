exports.interaction = async function (interaction, bot, db) {
  const questionId = interaction.options.getInteger("id");
  const [questionRow] = await db
    .promise()
    .query("SELECT * FROM trivia_questions WHERE id = ?", [questionId]);
  if (!questionRow[0]) {
    interaction.reply({
      content: "This question does not exist.",
      ephemeral: true,
    });
    return;
  }
  if (!questionRow[0].isopen) {
    interaction.reply({
      content: "This question is closed.",
      ephemeral: true,
    });
    return;
  }

  const [answerRow] = await db
    .promise()
    .query("SELECT * FROM trivia_answers WHERE user = ? AND questionid = ?", [
      interaction.user.id,
      questionId,
    ]);
  if (!answerRow[0]) {
    interaction.reply({
      content: "You do not have an answer to this question.",
      ephemeral: true,
    });
    return;
  }
  db.query("DELETE FROM trivia_answers WHERE user = ? AND questionid = ?", [
    interaction.user.id,
    questionId,
  ]);
  interaction.reply({
    content: "Your answer for question #" + questionId + " has been deleted.",
    ephemeral: true,
  });
};
