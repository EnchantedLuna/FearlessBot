const { ChannelType } = require("discord.js");

exports.run = function (message, args, bot, db) {
  if (message.channel.type !== ChannelType.DM) {
    message.channel.send(
      message.author.toString() + ", answer only in my DMs!"
    );
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
  db.query(
    "SELECT * FROM trivia_questions WHERE id = ?",
    [question],
    function (err, questionRow) {
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
    }
  );
};

exports.interaction = function (interaction, bot, db) {
  const questionId = interaction.options.getInteger("id");
  const answer = interaction.options.getString("answer");
  const userId = interaction.user.id;
  const userTag = interaction.user.username;
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
          content: "Question #" + questionId + " is no longer taking answers.",
          ephemeral: true,
        });
        return;
      }
      if (answer.length > 1700) {
        interaction.reply({
          content: "There's a 1700 character limit on answers. Sorry!",
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
                "Your answer to question #" +
                questionId +
                " (" +
                questionRow[0].question +
                ") has been submitted. Thank you!",
              ephemeral: true,
            });
            if (questionRow[0].watched) {
              bot.users.cache
                .get(questionRow[0].user)
                .send(
                  "**New answer for question #" +
                    questionId +
                    " from " +
                    userTag +
                    "**\n" +
                    answer
                );
            }
          } else {
            db.query(
              "UPDATE trivia_answers SET answer = ?, time=now(), viewed=0 WHERE user = ? AND questionid = ?",
              [answer, userId, questionId]
            );
            interaction.reply({
              content:
                "Your answer to question #" +
                questionId +
                " (" +
                questionRow[0].question +
                ") has been updated, replacing your previous answer (" +
                rows[0].answer +
                "). Thank you!",
              ephemeral: true,
            });
            if (questionRow[0].watched) {
              bot.users.cache
                .get(questionRow[0].user)
                .send(
                  "**Edited answer for question #" +
                    questionId +
                    " from " +
                    userTag +
                    "**\n" +
                    answer
                );
            }
          }
        }
      );
    }
  );
};
