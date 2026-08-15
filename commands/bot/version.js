const package = require("../../package.json");
const { EmbedBuilder } = require("discord.js");

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
