const { MessageEmbed } = require("discord.js");
exports.run = function (message, args, bot, db) {
  let choices = args.split(",");
  if (choices.length > 1) {
    let selectedChoice = choices[Math.floor(Math.random() * choices.length)];
    message.channel.send({
      embeds: [
          new MessageEmbed()
              .setTitle("Choosing for " + message.author.tag)
              .setDescription("I pick: " + selectedChoice.trim())
      ]
    });
  } else {
    message.channel.send({
      embeds: [
          new MessageEmbed()
              .setTitle("Choosing for " + message.author.tag)
              .setDescription(":warning: Usage: ``!choose option1, option2, option3``")
      ]
    });
  }
};
