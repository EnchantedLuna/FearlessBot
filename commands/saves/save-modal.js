const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
} = require("@discordjs/builders");
const { TextInputStyle } = require("discord.js");
const { isMod, log } = require("../../util");

exports.interaction = async function (interaction, bot, db) {
  const modal = new ModalBuilder()
    .setCustomId("save")
    .setTitle("Create Saved Item");

  const keywordInput = new TextInputBuilder()
    .setCustomId("keyword")
    .setLabel("Keyword (one word, no spaces)")
    .setStyle(TextInputStyle.Short);

  const valueInput = new TextInputBuilder()
    .setCustomId("value")
    .setLabel("Content")
    .setStyle(TextInputStyle.Paragraph);

  const firstActionRow = new ActionRowBuilder().addComponents(keywordInput);
  const secondActionRow = new ActionRowBuilder().addComponents(valueInput);

  // Add inputs to the modal
  modal.addComponents(firstActionRow, secondActionRow);

  // Show the modal to the user
  await interaction.showModal(modal);
};

exports.handleModalResponse = async function (interaction, bot, db) {
  const key = interaction.fields.getTextInputValue("keyword");
  const value = interaction.fields.getTextInputValue("value");
  if (key.startsWith("http")) {
    interaction.reply(
      ":warning: You probably messed up your command. Any URLs should be in the value, not the keyword."
    );
    return;
  }
  if (key.includes(" ")) {
    interaction.reply(":warning: Keywords should not contain spaces.");
    return;
  }
  if (value.includes("cdn.discordapp.com")) {
    interaction.reply(
      ":warning: Discord file upload links cannot be saved as the links will not be valid long-term."
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
