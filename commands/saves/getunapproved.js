const { interaction } = require("./getlist");

async function getUnapprovedItems(db, guildId) {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM data_store WHERE approved = 0 AND server = ?", [
      guildId,
    ]);
  if (rows.length === 0) {
    return "No unapproved items.";
  }

  let list = "";
  for (let i = 0; i < rows.length; i++) {
    list = list + "``" + rows[i].keyword + "``\n";
  }

  return "Unapproved:\n" + list;
}

exports.run = async function (message, args, bot, db) {
  message.reply("This command has been moved to /modsave getunapproved");
};

exports.interaction = async function (interaction, bot, db) {
  const unapproved = await getUnapprovedItems(db, interaction.guild.id);
  interaction.reply(unapproved);
};
