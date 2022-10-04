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
    let responseMessages = [];
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
      if (response.length + answerEntry > 4000) {
        responseMessages.push(response);
        response = "";
      }
      response += answerEntry;
    }
    responseMessages.push(response);
    const url = config.baseUrl + "question_tool.php?key=" + questionRow.web_key;
    if (message.author.id === questionAsker) {
      db.query("UPDATE trivia_answers SET viewed=1 WHERE questionid = ?", [id]);
    }
    const total = responseMessages.length;
    for (let i = 0; i < responseMessages.length; i++) {
      const part = i + 1;
      message.channel.send({
        embeds: [
          {
            title: "Answers part" + part + "/" + total,
            url: url,
            description: responseMessages[i],
          },
        ],
      });
    }
  });
}
