const config = require("../config.json");
const { isMod } = require("../util");

exports.run = function (message, args, bot, db, showOnlyNew) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [args], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("Invalid question id");
      return;
    }
    if (
      rows[0].user != message.author.id &&
      message.author.id != config.botAdminUserId
    ) {
      message.reply("You do not have permission to view these answers.");
      return;
    }
    getAnswerList(message, rows[0], showOnlyNew, bot, db);
  });
};

function getAnswerList(message, questionRow, showOnlyNew, bot, db) {
  let id = questionRow.id;
  let question = questionRow.question;
  let questionAsker = questionRow.user;
  let query =
    "SELECT user, answer FROM trivia_answers WHERE questionid = ? ORDER BY id";
  if (showOnlyNew) {
    query =
      "SELECT user, answer FROM trivia_answers WHERE questionid = ? AND viewed = 0 ORDER BY id";
  }
  db.query(query, [id], function (err, rows) {
    let response = "__Answers for question #" + id + ": " + question + "__\n";
    let userList = [];
    for (var i = 0; i < rows.length; i++) {
      let answer = rows[i].answer;
      let user = bot.users.resolve(rows[i].user);
      let username = "@" + user.tag;
      let answerEntry = "**" + username + "**\n" + answer + "\n\n";
      response += answerEntry;
      userList.push(username);
    }
    let mainServer = bot.guilds.cache.get(config.mainServer);
    if (
      typeof mainServer !== "undefined" &&
      isMod(message.author.id, mainServer)
    ) {
      response +=
        "Award all command: ```\n!alp 1 " + userList.join(" ") + "```";
    }
    if (message.author.id == questionAsker) {
      db.query("UPDATE trivia_answers SET viewed=1 WHERE questionid = ?", [id]);
    }

    message.reply(response, { split: true });
  });
}
