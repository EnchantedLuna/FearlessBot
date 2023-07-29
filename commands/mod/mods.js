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
  let mods = message.channel.guild.roles.cache.find(
    (role) => role.name === "mods"
  );
  if (mods === "undefined") {
    return;
  }
  let joinDate = message.member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < 60 * 60 * 24 * 14) {
    message.reply(
      "this command can only be used by members who have joined more than 2 weeks ago."
    );
    return;
  }

  if (!mods.editable) {
    message.reply("Error: I don't have permission to edit the mods role.");
    return;
  }

  mods.setMentionable(true, "activated by " + message.author.username);
  log(
    message.channel.guild,
    "Mods tag activated by " + message.author.username
  );
  message.reply(
    "the mods tag has activated. Do not continue if this is not a serious issue that needs attention and no mods are currently active. " +
      "Otherwise, use the tag quickly, as it will be disabled in 2 minutes."
  );
  setTimeout(function () {
    mods.setMentionable(false);
    log(message.channel.guild, "Mods tag deactivated.");
  }, 120000);
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
