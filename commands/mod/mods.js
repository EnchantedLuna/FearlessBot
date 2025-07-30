const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { log } = require("../../util");
const modsConfirmationMessage =
  "Are you sure you want to ping mods? Please only use this command if there is an **urgent issue** which needs attention, and no mods are currently active. You may be **warned or striked** for misusing this; only use when absolutely necessary";

const buttons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("allMods")
    .setLabel("Ping All Mods")
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary)
);

exports.run = function (message) {
  message.reply("Please use the /mods slash command instead.");
};

exports.interaction = async function (interaction, bot, db) {
  let mods = interaction.channel.guild.roles.cache.find(
    (role) => role.name === "mods"
  );
  if (mods === "undefined") {
    interaction.reply("error: mod role not found");
    return;
  }

  let joinDate = interaction.member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < 60 * 60 * 24 * 14) {
    interaction.reply(
      "This command can only be used by members who have joined more than 2 weeks ago."
    );
    return;
  }

  const response = await interaction.reply({
    content: modsConfirmationMessage,
    components: [buttons],
    fetchReply: true,
  });

  const opFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: opFilter,
      time: 30_000,
    });

    if (confirmation.customId === "allMods") {
      await confirmation.update({
        content: `Okay, pinging the mods.`,
        components: [],
      });
      await interaction.guild.members.fetch();
      const modList = mods.members.map((m) => "<@" + m.id + ">");
      interaction.channel.send(
        "Summoned by " +
          interaction.user.username +
          ": " +
          interaction.options.getString("reason") +
          "\n" +
          modList.join(" ")
      );
    } else if (confirmation.customId === "cancel") {
      await confirmation.update({
        content: "Okay, I won't ping the mods.",
        components: [],
      });
    }
  } catch (e) {
    console.log(e);
    await interaction.editReply({
      content:
        "This mods ping action has been cancelled due to lack of action.",
      components: [],
    });
  }
};
