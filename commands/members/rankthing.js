const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { escapeText } = require("../../util");
const friendlyNames = {
  lorpoints: "lorpoints",
  words: "words",
  lifetime_lorpoints: "lorpoints",
};

exports.run = function (message, page, bot, db, thing) {
  let entries = [];
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("previousButton")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("nextButton")
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
  );

  db.query(
    "SELECT username, " +
      thing +
      " AS thing FROM members WHERE server = ? AND " +
      thing +
      " > 0 AND active=1 ORDER BY " +
      thing +
      " DESC",
    [message.channel.guild.id],
    function (err, rows) {
      if (rows.length < 1) {
        return message.channel.send(
          "No one has any " + friendlyNames[thing] + " currently."
        );
      }

      let count = 0;
      let rank = 0;
      let previousThing = null;
      rows.forEach(function (member) {
        count++;
        rank = member.thing === previousThing ? rank : count;
        previousThing = member.thing;
        entries.push(
          rank +
            ": " +
            member.username +
            " - " +
            member.thing +
            " " +
            friendlyNames[thing]
        );
      });

      const embeds = [];
      let i,
        j,
        p,
        tempArray,
        chunk = 20;
      for (i = 0, p = 1, j = entries.length; i < j; i += chunk, p++) {
        tempArray = entries.slice(i, i + chunk);
        embeds.push(
          new EmbedBuilder()
            .setTitle(":first_place: Ranking for " + friendlyNames[thing])
            .setDescription(tempArray.join("\n"))
        );
      }

      if (embeds.length === 1) {
        return message.channel.send({ embeds: [embeds[0]] });
      }

      message.channel
        .send({ embeds: [embeds[0]], components: [buttons] })
        .then((sentInteraction) => {
          let i = 0;

          const filter = async (i) => {
            await i.deferUpdate();
            return i.user.id === message.author.id;
          };

          const collector = sentInteraction.createMessageComponentCollector({
            filter,
            idle: 20000,
          });

          collector.on("collect", (interaction) => {
            if (interaction.customId === "nextButton") {
              i++;
              if (i >= embeds.length) i = 0;
              interaction.editReply({
                embeds: [embeds[i]],
              });
            } else {
              i--;
              if (i < 0) i = embeds.length - 1;
              interaction.editReply({
                embeds: [embeds[i]],
              });
            }
          });

          collector.on("end", () => {
            sentInteraction.edit({ components: [] });
          });
        });
    }
  );
};

exports.interaction = function (interaction, bot, db) {
  const thing = interaction.options.getString("type");
  let entries = [];
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("previousButton")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("nextButton")
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
  );

  db.query(
    "SELECT username, " +
      thing +
      " AS thing FROM members WHERE server = ? AND " +
      thing +
      " > 0 AND active=1 ORDER BY " +
      thing +
      " DESC",
    [interaction.guild.id],
    function (err, rows) {
      if (rows.length < 1) {
        return interaction.reply(
          "No one has any " + friendlyNames[thing] + " currently."
        );
      }

      let count = 0;
      let rank = 0;
      let previousThing = null;
      rows.forEach(function (member) {
        count++;
        rank = member.thing === previousThing ? rank : count;
        previousThing = member.thing;
        const escapedName = escapeText(member.username);
        entries.push(
          rank +
            ": " +
            escapedName +
            " - " +
            member.thing +
            " " +
            friendlyNames[thing]
        );
      });

      const embeds = [];
      let i,
        j,
        p,
        tempArray,
        chunk = 20;
      for (i = 0, p = 1, j = entries.length; i < j; i += chunk, p++) {
        tempArray = entries.slice(i, i + chunk);
        const thisEmbed = new EmbedBuilder()
          .setTitle(":first_place: Ranking for " + friendlyNames[thing])
          .setDescription(tempArray.join("\n"));
        if (thing == "lifetime_lorpoints") {
          thisEmbed.setFooter({
            text: "Note: This only reflects points earned in completed seasons.",
          });
        }
        embeds.push(thisEmbed);
      }

      if (embeds.length === 1) {
        return interaction.reply({ embeds: [embeds[0]] });
      }

      interaction
        .reply({ embeds: [embeds[0]], components: [buttons] })
        .then((sentInteraction) => {
          let i = 0;

          const filter = async (i) => {
            await i.deferUpdate();
            return i.user.id === interaction.user.id;
          };

          const collector = sentInteraction.createMessageComponentCollector({
            filter,
            idle: 20000,
          });

          collector.on("collect", (subInteraction) => {
            if (subInteraction.customId === "nextButton") {
              i++;
              if (i >= embeds.length) i = 0;
              subInteraction.editReply({
                embeds: [embeds[i]],
              });
            } else {
              i--;
              if (i < 0) i = embeds.length - 1;
              subInteraction.editReply({
                embeds: [embeds[i]],
              });
            }
          });

          collector.on("end", () => {
            sentInteraction.edit({ components: [] });
          });
        });
    }
  );
};
