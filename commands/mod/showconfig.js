const util = require("../../util");
const { EmbedBuilder } = require("discord.js");

exports.interaction = async function (interaction, bot, db) {
  const allConfig = await util.getAllGuildConfig(interaction.guild.id, db);
  console.log(allConfig);
  let response = "";
  for (const key in allConfig) {
    response += "**" + key + "**: " + allConfig[key] + "\n";
  }
  interaction.reply({
    embeds: [
      new EmbedBuilder().setTitle("Server Config").setDescription(response),
    ],
  });
};
