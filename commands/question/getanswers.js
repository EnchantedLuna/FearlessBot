const config = require("../../config.json");

exports.interaction = function (interaction, bot, db) {
  const id = interaction.options.getInteger("id");
  db.query(
    "SELECT * FROM trivia_questions WHERE id = ?",
    [id],
    function (err, rows) {
      if (rows[0] == null) {
        interaction.reply({
          content: "That question does not exist.",
          ephemeral: true,
        });
        return;
      }
      if (
        rows[0].user !== interaction.user.id &&
        interaction.user.id !== config.botAdminUserId
      ) {
        interaction.reply({
          content: "You do not have permission to view these answers.",
          ephemeral: true,
        });
        return;
      }
      const url = config.baseUrl + "question_tool.php?key=" + rows[0].web_key;
      const responseText =
        "Question #" + id + ": " + rows[0].question + "\nAnswers: " + url;
      interaction.reply({
        content: responseText,
        ephemeral:
          interaction.guild && !rows[0].question.startsWith("Eras Tour")
            ? true
            : false,
      });
    }
  );
};
