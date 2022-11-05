const { isMod, log } = require("../../util");

async function deleteSave(user, guild, keyword, db) {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [
      guild.id,
      keyword,
    ]);
  if (!rows[0]) {
    return ":warning: Keyword not found.";
  }
  if (rows[0].owner !== user.id && !isMod(user.id, guild)) {
    return ":warning: You can only delete items that you have saved.";
  }
  await db
    .promise()
    .query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [
      guild.id,
      keyword,
    ]);
  log(guild, "Saved item " + keyword + " has been deleted by " + user.username);
  return ":put_litter_in_its_place: Saved item deleted.";
}

exports.run = function (message, keyword, bot, db) {
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (
        typeof rows[0] !== "undefined" &&
        (isMod(message.member, message.channel.guild) ||
          rows[0].owner === message.author.id)
      ) {
        message.channel.send(":put_litter_in_its_place: Saved item deleted.");
        db.query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [
          message.channel.guild.id,
          keyword,
        ]);
        log(
          message.channel.guild,
          "Saved item " +
            keyword +
            " has been deleted by " +
            message.author.username
        );
      } else if (typeof rows[0] !== "undefined") {
        message.channel.send(
          ":warning: You can only delete items that you have saved."
        );
      } else {
        message.channel.send(":warning: Keyword not found.");
      }
    }
  );
};

exports.interaction = async function (interaction, bot, db) {
  const keyword = interaction.options.getString("keyword");
  interaction.reply(
    await deleteSave(interaction.user, interaction.guild, keyword, db)
  );
};
