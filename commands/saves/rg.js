async function getItem(db, guildId, prefix) {
  const prefixString = prefix ? " AND keyword LIKE ? " : "";
  const sql =
    "SELECT * FROM data_store WHERE server = ? AND approved = 1" +
    prefixString +
    " ORDER BY RAND() LIMIT 1";
  const params = [guildId];
  if (prefix) {
    params.push(prefix + "%");
  }
  const [rows, fields] = await db.promise().query(sql, params);
  if (!rows[0]) {
    return "No saved items found.";
  }
  return rows[0]["keyword"] + ": " + rows[0]["value"];
}

exports.run = async function (message, args, bot, db) {
  const item = await getItem(db, message.channel.guild.id);
  message.reply(item, db, {
    allowedMentions: { users: [] },
  });
};

exports.interaction = async function (interaction, bot, db) {
  const prefix = interaction.options.getString("prefix");
  const item = await getItem(db, interaction.guild.id, prefix);
  interaction.reply(item, db, {
    allowedMentions: { users: [] },
  });
};
