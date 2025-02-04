const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { log } = require("../../util");

const buttons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("muteMe")
    .setLabel("Mute Me!")
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Never mind")
    .setStyle(ButtonStyle.Secondary)
);

exports.interaction = async function (interaction, bot, db) {
  const minutes = interaction.options.getInteger("length");
  const response = await interaction.reply({
    content:
      "This command will give yourself a timeout, in case you need a break. You have selected a timeout for **" +
      minutes +
      " minutes**. Are you sure?\n\nPlease do not message moderators to remove your timeout.",
    components: [buttons],
    fetchReply: true,
  });

  const opFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: opFilter,
      time: 30_000,
    });

    if (confirmation.customId === "muteMe") {
      const interval = minutes * 60 * 1000;
      interaction.member
        .timeout(interval, "Self-requested by /muteme command")
        .then(() => {
          confirmation.update({
            content: "Okay, see you in " + minutes + " minutes!",
            components: [],
          });
        })
        .catch((e) =>
          confirmation.update({
            content: `Looks like I don't have the permissions to mute you, sorry!`,
            components: [],
          })
        );
    } else if (confirmation.customId === "cancel") {
      await confirmation.update({
        content: "Okay, you have not been muted.",
        components: [],
      });
    }
  } catch (e) {
    console.log(e);
    await interaction.editReply({
      content: "This mute action has been cancelled due to lack of action.",
      components: [],
    });
  }
};
