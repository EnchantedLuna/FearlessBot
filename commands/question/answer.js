exports.run = function (message, args, bot, db) {
  if (message.channel.type === "text") {
    message.reply("answer only in my DMs!");
    if (message.deletable) {
      message.delete();
    }
    return;
  }

  let arg = args.split(" ");
  let question = arg[0];
  let answer = arg.slice(1, arg.length).join(" ");
  message.attachments.each(
    (attachment) => (answer += "\n<" + attachment.url + ">")
  );
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [question], function (
    err,
    questionRow
  ) {
    if (questionRow[0] == null) {
      message.reply("That question id is invalid. Please try again.");
      return;
    }
    if (!questionRow[0].isopen) {
      message.reply(
        "Question #" + questionRow[0].id + " is no longer taking answers."
      );
      return;
    }
    if (answer.length > 1700) {
      message.reply("There's a 1700 character limit on answers. Sorry!");
      return;
    }
    db.query(
      "SELECT * FROM trivia_answers WHERE user = ? AND questionid = ?",
      [message.author.id, question],
      function (err, rows) {
        if (rows.length === 0) {
          db.query(
            "INSERT INTO trivia_answers (user, questionid, answer, time) VALUES (?,?,?,now())",
            [message.author.id, question, answer]
          );
          message.reply(
            "Your answer to question #" +
              question +
              " (" +
              questionRow[0].question +
              ") has been submitted. Thank you!"
          );
          if (questionRow[0].watched) {
            bot.users.cache
              .get(questionRow[0].user)
              .send(
                "**New answer for question #" +
                  question +
                  " from " +
                  message.author.tag +
                  "**\n" +
                  answer
              );
          }
        } else {
          db.query(
            "UPDATE trivia_answers SET answer = ?, time=now(), viewed=0 WHERE user = ? AND questionid = ?",
            [answer, message.author.id, question]
          );
          message.reply(
            "Your answer to question #" +
              question +
              " (" +
              questionRow[0].question +
              ") has been updated, replacing your previous answer (" +
              rows[0].answer +
              "). Thank you!"
          );
          if (questionRow[0].watched) {
            bot.users.cache
              .get(questionRow[0].user)
              .send(
                "**Edited answer for question #" +
                  question +
                  " from " +
                  message.author.tag +
                  "**\n" +
                  answer
              );
          }
        }
      }
    );
  });
};
