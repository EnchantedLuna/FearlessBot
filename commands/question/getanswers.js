const config = require("../../config.json");
const { isMod } = require("../../util");

exports.run = async function (message, args, bot, db, showOnlyNew) {
  db.query(
    "SELECT * FROM trivia_questions WHERE id = ?",
    [args],
    function (err, rows) {
      if (rows[0] == null) {
        message.reply("That question does not exist.");
        return;
      }
      if (
        rows[0].user !== message.author.id &&
        message.author.id !== config.botAdminUserId
      ) {
        message.reply("You do not have permission to view these answers.");
        return;
      }
      getAnswerList(message, rows[0], showOnlyNew, bot, db);
    }
  );
};

async function getAnswerList(message, questionRow, showOnlyNew, bot, db) {
  let id = questionRow.id;
  let question = questionRow.question;
  let questionAsker = questionRow.user;
  let query =
    "SELECT user, answer FROM trivia_answers WHERE questionid = ? ORDER BY id";
  if (showOnlyNew) {
    query =
      "SELECT user, answer FROM trivia_answers WHERE questionid = ? AND viewed = 0 ORDER BY id";
  }
  const questionStatus = questionRow.isopen ? "Open" : "Closed";
  db.query(query, [id], async function (err, rows) {
    let response =
      "**Answers for question #" +
      id +
      ": " +
      question +
      " (" +
      questionStatus +
      ")**\n";
    for (let i = 0; i < rows.length; i++) {
      let answer = rows[i].answer;
      let user = await bot.users.fetch(rows[i].user);
      let username = user ? "@" + user.tag : "Unknown " + rows[i].user;
      let answerEntry = "**" + username + "**\n" + answer + "\n\n";
      if (response.length + answerEntry.length > 4000) {
        response = "Too many answers, please view the webpage.";
        break;
      }
      response += answerEntry;
    }
    const url = config.baseUrl + "question_tool.php?key=" + questionRow.web_key;
    if (message.author.id === questionAsker) {
      db.query("UPDATE trivia_answers SET viewed=1 WHERE questionid = ?", [id]);
    }
    message.channel.send({
      embeds: [
        {
          title: "Answers (click for award tool)",
          url: url,
          description: response,
        },
      ],
    });
  });
}

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
        interaction.user.id !== config.botAdminUserId &&
        !rows[0].question.startsWith("Eras Tour")
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
