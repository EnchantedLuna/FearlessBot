const acronyms = require("./song-acronyms.json");

function getAnswer(searchTerm) {
    let capitalizedSearchTerm = searchTerm.toUpperCase();
    if (capitalizedSearchTerm in acronyms) {
        return searchTerm + " refers to " + acronyms[capitalizedSearchTerm];
    }
    return "I don't have a definition for " + searchTerm + ", sorry!";
}

exports.run = function(message, args, bot, db) {
    message.reply(getAnswer(args));
}

exports.interaction = function(interaction, bot, db) {
    const searchTerm = interaction.data.options[0].value;
    const answer = getAnswer(searchTerm);
    let response = {
      data: {
        type: 4,
        data: {
          content : answer
        }
      }
    };
    bot.api.interactions(interaction.id, interaction.token).callback.post(response);
}