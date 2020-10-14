exports.run = function (message, params, bot, db) {
  if (params == "") {
    message.reply("Please enter a question, e.g. ``!question Is butt legs?``");
    return;
  }
  db.query(
    "INSERT INTO trivia_questions (user, question, timecreated) VALUES (?, ?, now())",
    [message.author.id, params],
    function (err, result) {
      message.reply("Question #" + result.insertId + " has been registered.");
    }
  );
};
