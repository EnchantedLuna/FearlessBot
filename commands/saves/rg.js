async function getItem(db, guildId) {
  const [rows, fields] = await db
    .promise()
    .query(
      "SELECT * FROM data_store WHERE server = ? AND approved = 1 ORDER BY RAND() LIMIT 1",
      [guildId]
    );
  if (!rows) {
    return "No saved items in this server.";
  }
  return rows[0]["keyword"] + ": " + rows[0]["value"];
}

exports.run = async function (message, args, bot, db) {
  const item = await getItem(db, message.channel.guild.id, db);
  message.reply(item, db, {
    allowedMentions: { users: [] },
  });
};

exports.interaction = async function (interaction, bot, db) {
  const item = await getItem(db, interaction.guild.id);
  interaction.reply(item, db, {
    allowedMentions: { users: [] },
  });
};
