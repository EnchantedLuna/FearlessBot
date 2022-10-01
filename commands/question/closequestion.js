const config = require("../../config.json");
async function closeQuestion(db, userId, questionNumber) {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM trivia_questions WHERE id = ?", [questionNumber]);
  if (!rows[0]) {
    return "Invalid question number.";
  }
  if (rows[0].user !== userId && userId !== config.botAdminUserId) {
    return "You do not have permission to close this question.";
  }
  await db
    .promise()
    .query("UPDATE trivia_questions SET isopen=0 WHERE id = ?", [
      questionNumber,
    ]);
  return "Question #" + questionNumber + " has been closed.";
}

exports.run = async function (message, params, bot, db) {
  const result = await closeQuestion(db, message.author.id, params);
  message.reply(result);
};

exports.interaction = async function (interaction, bot, db) {
  const id = interaction.options.getInteger("id");
  const result = await closeQuestion(db, interaction.user.id, id);
  interaction.reply(result);
};
