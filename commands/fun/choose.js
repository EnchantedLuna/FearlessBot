const { MessageEmbed } = require("discord.js");

function choose(choices, user)
{
  if (choices.length > 1) {
    let selectedChoice = choices[Math.floor(Math.random() * choices.length)];
    return {
      embeds: [
          new MessageEmbed()
              .setTitle("Choosing for " + user)
              .setDescription("I pick: " + selectedChoice.trim())
      ]
    };
  } else {
    return {
      embeds: [
          new MessageEmbed()
              .setTitle("Choosing for " + user)
              .setDescription(":warning: Usage: ``!choose option1, option2, option3``")
      ]
    };
  }
}

exports.run = function (message, args, bot, db) {
  const choices = args.split(",");
  message.channel.send(choose(choices, message.author.tag));
};

exports.interaction = function(interaction, bot, db) {
  const choices = interaction.options.getString("choices").split(",");
  interaction.reply(choose(choices, interaction.user.tag));
}
