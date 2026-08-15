const crypto = require("crypto");

exports.interaction = function (interaction, bot, db) {
  const question = interaction.options.getString("question");
  db.query(
    "INSERT INTO trivia_questions (user, question, timecreated, web_key) VALUES (?, ?, now(), ?)",
    [interaction.user.id, question, crypto.randomUUID()],
    function (err, result) {
      interaction.reply({
        content: "Question #" + result.insertId + " has been registered.",
      });
    }
  );
};
