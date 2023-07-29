const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { log } = require("../../util");

const buttons = new MessageActionRow().addComponents(
  new MessageButton()
    .setCustomId("allMods")
    .setLabel("Ping All Mods")
    .setStyle("PRIMARY"),
  new MessageButton()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle("SECONDARY")
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
    content:
      "Are you sure you want to ping mods? Please only do this if there is an issue that needs attention and there are no mods currently active.",
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
        "You have been summoned by " +
          interaction.user.username +
          ".\n" +
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
