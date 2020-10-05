const config = require("../config.json");
const { isMod } = require("../util");

exports.run = function (message, args, bot, db, showOnlyNew) {
  db.query("SELECT * FROM trivia_questions WHERE id = ?", [args], function (
    err,
    rows
  ) {
    if (rows[0] == null) {
      message.reply("That question does not exist.");
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
  const questionStatus = questionRow.isopen ? "Open" : "Closed";
  db.query(query, [id], function (err, rows) {
    let response =
      "**Answers for question #" +
      id +
      ": " +
      question +
      " (" +
      questionStatus +
      ")**\n";
    let userList = [];
    let userIdList = [];
    for (var i = 0; i < rows.length; i++) {
      let answer = rows[i].answer;
      let user = bot.users.resolve(rows[i].user);
      let username = user ? "@" + user.tag : "Unknown user " + rows[i].user;
      let answerEntry = "**" + username + "**\n" + answer + "\n\n";
      response += answerEntry;
      if (user) {
        userList.push(username);
        userIdList.push("<@!" + user.id + ">");
      }
    }
    let mainServer = bot.guilds.cache.get(config.mainServer);
    let userListString = "";
    if (
      typeof mainServer !== "undefined" &&
      isMod(message.author.id, mainServer) &&
      userList.length > 0
    ) {
      userListString +=
        "User list for awarding: ```\n" + userList.join(" ") + "```";
      userListString +=
        "User list as IDs for awarding:\n```\n" + userIdList.join(" ") + "```";
    }
    if (message.author.id == questionAsker) {
      db.query("UPDATE trivia_answers SET viewed=1 WHERE questionid = ?", [id]);
    }
    if (response.length + userListString.length > 2000) {
      message.reply(response, { split: true });
      message.reply(userListString, { split: true });
    } else {
      message.reply(response + userListString, { split: true });
    }
  });
}
