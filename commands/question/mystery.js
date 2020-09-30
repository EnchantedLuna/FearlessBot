const answers = require("../../mystery-answers.json");
exports.run = function (message, args, bot, db) {
  if (answers.answerList.includes(args.toLowerCase())) {
    message.reply("Yes, " + args + " is in the set.");
  } else {
    message.reply("No, " + args + " is not in the set.");
  }
};
