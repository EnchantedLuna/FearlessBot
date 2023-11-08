const package = require("../../package.json");
const { EmbedBuilder } = require("discord.js");

exports.run = function (message, args, bot, db) {
  message.channel.send({
    embeds: [
      new EmbedBuilder().setDescription(
        ":robot: FearlessBot version: " + package.version
      ),
    ],
  });
};

exports.interaction = function (interaction, bot, db) {
  interaction.reply({
    embeds: [
      new EmbedBuilder().setDescription(
        ":robot: FearlessBot version: " + package.version
      ),
    ],
    ephemeral: true,
  });
};
