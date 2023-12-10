const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  chatInputApplicationCommandMention,
} = require("discord.js");
const { isMod, log } = require("../../util");

exports.run = function (message, args, bot, db) {
  message.reply(
    ":warning: This command now requires the use of the slash command `/save create`"
  );
};

exports.interaction = function (interaction, bot, db) {
  const key = interaction.options.getString("keyword");
  const value = interaction.options.getString("value");
  if (key.startsWith("http")) {
    interaction.reply(
      ":warning: You probably messed up your command. Any URLs should be in the value, not the keyword."
    );
    return;
  }

  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [interaction.guild.id, key],
    function (err, rows) {
      if (
        isMod(interaction.member, interaction.guild) &&
        (rows[0] == null || rows[0]["owner"] === interaction.user.id)
      ) {
        db.query(
          "REPLACE INTO data_store (server, keyword, value, owner, approved, timeadded, approvedby) VALUES (?,?,?,?,1,now(),?)",
          [
            interaction.guild.id,
            key,
            value,
            interaction.user.id,
            interaction.user.id,
          ]
        );
        interaction.reply(
          ":white_check_mark: Saved item updated and ready to use."
        );
        log(
          interaction.guild,
          interaction.user.username +
            " created item " +
            key +
            " - auto approved\nValue: " +
            value
        );
      } else if (rows[0] == null) {
        db.query(
          "INSERT INTO data_store (server, keyword, value, owner, timeadded) VALUES (?,?,?,?,now())",
          [interaction.guild.id, key, value, interaction.user.id]
        );
        interaction.reply(
          ":ballot_box_with_check: Saved item created. This will need to be approved before it can be used."
        );
        log(
          interaction.guild,
          interaction.user.username +
            " created item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else if (rows[0]["owner"] === interaction.user.id) {
        db.query(
          "UPDATE data_store SET value = ?, approved=0, timeadded=now(), approvedby=null WHERE keyword = ? AND server = ?",
          [value, key, interaction.guild.id]
        );
        interaction.reply(
          ":ballot_box_with_check: Saved item updated. This will need to be approved before it can be used."
        );
        log(
          interaction.guild,
          interaction.user.username +
            " updated item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else {
        interaction.reply(
          ":warning: Error saving: this keyword already exists."
        );
      }
    }
  );
};
