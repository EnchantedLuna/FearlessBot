const package = require("../../package.json");
const { MessageEmbed } = require("discord.js");

exports.run = function (message, args, bot, db) {
  message.channel.send({
    embeds: [
        new MessageEmbed()
            .setDescription(":robot: FearlessBot version: " + package.version)
    ]
  });
};
