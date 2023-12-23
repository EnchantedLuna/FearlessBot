async function getBans(db, guild) {
  const [rows] = await db.promise().query(
    "SELECT m.id, m.username, m.discriminator, sa.action, sa.effectivetime, sa.roleid FROM scheduled_actions sa JOIN members m ON sa.guild=m.server AND sa.user=m.id \
        WHERE guild = ? AND completed=0 ORDER BY effectivetime ASC LIMIT 20",
    [guild.id]
  );
  let result = "";
  if (rows.length === 0) {
    result += "(none)\n";
  }
  for (let row of rows) {
    const timestamp = row.effectivetime.getTime() / 1000;
    const timestampString = "<t:" + timestamp + ":R>";
    const type = getType(row.action, row.roleid, guild);
    let displayUser = row.username;
    if (row.discriminator != 0) {
      displayUser = displayUser + "#" + row.discriminator;
    }
    const line =
      type +
      ": " +
      displayUser +
      " (" +
      row.id +
      ") - " +
      timestampString +
      "\n";
    result += line;
  }
  return result;
}

function getType(action, roleid, guild) {
  switch (action) {
    case "unban":
      return "Ban";
    case "unmute":
      return "Mute";
    case "removerole":
      const role = guild.roles.cache.find((role) => role.id === roleid);
      return "Role " + role.name;
    default:
      return "Unknown Type";
  }
}

exports.interaction = async function (interaction, bot, db) {
  const response = await getBans(db, interaction.guild);
  interaction.reply({
    embeds: [{ title: "Upcoming Expirations", description: response }],
  });
};
