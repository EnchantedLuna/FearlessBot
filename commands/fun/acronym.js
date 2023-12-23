const acronyms = require("./song-acronyms.json");

function getAnswer(searchTerm) {
  let capitalizedSearchTerm = searchTerm.toUpperCase();
  if (capitalizedSearchTerm in acronyms) {
    return searchTerm + " refers to " + acronyms[capitalizedSearchTerm];
  }
  return "";
}

exports.run = function (message, args, bot, db) {
  let answer = getAnswer(args);
  if (answer == "") {
    message.reply("I don't have an answer for that, sorry!");
    return;
  }
  message.reply(getAnswer(args));
};

exports.interaction = function (interaction, bot, db) {
  const searchTerm = interaction.options.getString("term");
  const answer = getAnswer(searchTerm);
  if (answer == "") {
    interaction.reply({
      content: "I don't have a definition for " + searchTerm + ", sorry!",
      ephemeral: true,
    });
    return;
  }
  interaction.reply({ content: answer });
};
