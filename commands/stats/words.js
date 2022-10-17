const { findMemberID } = require("../../util");

async function getWords(db, guildId, memberId) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT words, messages, username FROM members WHERE server = ? AND id = ?",
      [guildId, memberId]
    );
  if (!rows[0]) {
    return "Member not found.";
  }
  const average =
    rows[0].messages > 0
      ? Math.round((rows[0].words / rows[0].messages) * 100) / 100
      : 0;
  return (
    rows[0].username +
    " has used " +
    rows[0].words +
    " words in " +
    rows[0].messages +
    " messages, an average of " +
    average +
    " words per message."
  );
}

exports.run = async function (message, params, bot, db) {
  const member = findMemberID(message, params, bot);
  message.channel.send(await getWords(db, message.channel.guild.id, member));
};

exports.interaction = async function (interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }
  const response = await getWords(db, interaction.guild.id, member.id);
  interaction.reply({
    embeds: [{ title: "Word Count", description: response }],
  });
};
