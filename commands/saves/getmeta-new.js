const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { channelCountsInStatistics, isMod, log } = require("../../util");

async function getItem(db, guildId, keyword, showUnapproved) {
  let embed = { title: keyword };
  const [rows] = await db
    .promise()
    .query(
      "SELECT * FROM data_store LEFT JOIN members saver ON data_store.owner=saver.id AND data_store.server=saver.server WHERE data_store.server = ? AND keyword = ? ",
      [guildId, keyword]
    );
  if (!rows[0]) {
    embed.color = 0xff0000;
    embed.description =
      ":warning: Nothing is stored for keyword " + keyword + ".";
    return embed;
  }
  if (!rows[0].approved && !showUnapproved) {
    embed.description = ":warning: This item has not been approved yet.";
    return embed;
  } else if (rows[0].approved && showUnapproved) {
    embed.color = 0x00ff00;
  }
  let lastused =
    rows[0].lastused !== null ? rows[0].lastused.toString() : "never";
  let timeadded =
    rows[0].timeadded !== null
      ? rows[0].timeadded.toString()
      : "a long time ago";
  let fieldList = [
    { name: "Uses", value: rows[0].uses.toString() },
    { name: "Last Used", value: lastused },
    { name: "Saved By", value: rows[0].username },
    { name: "Time Added", value: timeadded },
  ];
  if (showUnapproved) {
    const approvedStatus = rows[0].approved ? "Yes" : "No";
    fieldList.push({ name: "Approved", value: approvedStatus });
  }
  embed.fields = fieldList;
  return embed;
}

exports.interaction = async function (interaction, bot, db) {
  let keyword = interaction.options.getString("keyword");
  let isModReview = interaction.commandName == "modsave";
  const embed = await getItem(db, interaction.guild.id, keyword, isModReview);
  interaction.reply({ embeds: [embed] });
};
