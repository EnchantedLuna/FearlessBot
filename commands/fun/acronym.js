const acronyms = require("./song-acronyms.json");

function getAnswer(searchTerm) {
  let capitalizedSearchTerm = searchTerm.toUpperCase();
  if (capitalizedSearchTerm in acronyms) {
    return searchTerm + " refers to " + acronyms[capitalizedSearchTerm];
  }
  return "I don't have a definition for " + searchTerm + ", sorry!";
}

exports.run = function (message, args, bot, db) {
  message.reply(getAnswer(args));
};

exports.interaction = function (interaction, bot, db) {
  const searchTerm = interaction.options.getString("term");
  const answer = getAnswer(searchTerm);
  interaction.reply({ content: answer });
};
