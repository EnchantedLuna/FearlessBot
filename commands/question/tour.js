exports.interaction = function (interaction, bot, db) {
  const questionId = interaction.options.getInteger("show");
  const answer = interaction.options.getString("message");
  const userId = interaction.user.id;
  const userTag =
    interaction.user.username + "#" + interaction.user.discriminator;
  db.query(
    "SELECT * FROM trivia_questions WHERE id = ?",
    [questionId],
    function (err, questionRow) {
      if (questionRow[0] == null) {
        interaction.reply({
          content: "That question id is invalid. Please try again.",
          ephemeral: true,
        });
        return;
      }
      if (!questionRow[0].isopen) {
        interaction.reply({
          content:
            "Question #" + questionId + " is no longer taking submissions.",
          ephemeral: true,
        });
        return;
      }
      if (answer.length > 1700) {
        interaction.reply({
          content: "There's a 1700 character limit on messages. Sorry!",
          ephemeral: true,
        });
        return;
      }
      db.query(
        "SELECT * FROM trivia_answers WHERE user = ? AND questionid = ?",
        [userId, questionId],
        function (err, rows) {
          if (rows.length === 0) {
            db.query(
              "INSERT INTO trivia_answers (user, questionid, answer, time) VALUES (?,?,?,now())",
              [userId, questionId, answer]
            );
            interaction.reply({
              content:
                "Your response to " +
                questionRow[0].question +
                " has been submitted. Thank you!",
              ephemeral: false,
            });
          } else {
            db.query(
              "UPDATE trivia_answers SET answer = ?, time=now(), viewed=0 WHERE user = ? AND questionid = ?",
              [answer, userId, questionId]
            );
            interaction.reply({
              content:
                "Your response to " +
                questionRow[0].question +
                " has been updated, replacing your previous message. Thank you!",
              ephemeral: true,
            });
          }
        }
      );
    }
  );
};
