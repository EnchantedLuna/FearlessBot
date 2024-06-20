const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { channelCountsInStatistics, isMod, log } = require("../../util");

const buttons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("approve")
    .setLabel("Approve")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("delete")
    .setLabel("Delete")
    .setStyle(ButtonStyle.Danger)
);

async function getItem(
  db,
  guildId,
  channelId,
  keyword,
  showUnapproved,
  author
) {
  let embed = { title: keyword };
  const isUsingSlashCommand = author === null;
  if (author) {
    embed.author = {
      name: author.tag,
      icon_url: author.displayAvatarURL({
        dynamic: true,
        format: "png",
        size: 64,
      }),
    };
  }
  const [rows] = await db
    .promise()
    .query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [
      guildId,
      keyword,
    ]);
  if (!rows[0]) {
    if (!isUsingSlashCommand) {
      embed.description = "not found";
      return embed;
    }
    embed.color = 0xff0000;
    embed.description =
      ":warning: Nothing is stored for keyword " + keyword + ".";
    return embed;
  }
  if (!rows[0].approved && !showUnapproved) {
    embed.description = ":warning: This item has not been approved yet.";
    return embed;
  } else if (rows[0].approved && showUnapproved) {
    embed.color = 0x00ff00;
  }
  addToStats(db, guildId, channelId, keyword);
  const text = rows[0]["value"];
  let date = "Created: ";
  if (rows[0].timeadded !== null) {
    date += rows[0].timeadded.toDateString();
  } else {
    date += "a long time ago";
  }
  embed.footer = { text: date };

  if (text.match("^(http(s?):)([/|.|\\w|\\s|-])*\\.(?:jpg|gif|png|jpeg)$")) {
    embed.image = { url: text };
    return embed;
  }

  embed.description = text;
  return embed;
}

async function addToStats(db, guildId, channelId, keyword) {
  if (await channelCountsInStatistics(guildId, channelId, db)) {
    db.query(
      "UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?",
      [keyword, guildId]
    );
  }
}

exports.run = async function (message, args, bot, db, showUnapproved) {
  let arg = args.split(" ");
  let keyword = arg[0];
  if (keyword === "") return;
  const embed = await getItem(
    db,
    message.channel.guild.id,
    message.channel.id,
    keyword,
    showUnapproved,
    message.author
  );
  if (embed.description == "not found") {
    await sleep(250);
    message.react("❌");
    return;
  }
  if (embed.description?.includes("youtube.com/watch")) {
    message.reply({
      content: embed.description + "\n" + embed.footer.text,
    });
    return;
  }
  message.channel.send({ embeds: [embed] });
};

exports.interaction = async function (interaction, bot, db) {
  let keyword = interaction.options.getString("keyword");
  let isModReview = interaction.commandName == "modsave";
  const embed = await getItem(
    db,
    interaction.guild.id,
    interaction.channel.id,
    keyword,
    isModReview,
    null
  );
  const isNotFound = embed.color === 0xff0000;
  const isAlreadyApproved = embed.color === 0x00ff00;
  if (embed.description?.includes("youtube.com/watch")) {
    interaction.reply({
      content: embed.description + "\n" + embed.footer.text,
    });
    return;
  }
  if (isModReview && !isNotFound && !isAlreadyApproved) {
    const response = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      fetchReply: true,
    });
    const opFilter = (i) => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: opFilter,
        time: 30_000,
      });
      if (confirmation.customId === "approve") {
        await db
          .promise()
          .query(
            "UPDATE data_store SET approved=1, approvedby=? WHERE keyword = ? AND server = ? AND approvedby is null",
            [interaction.user.id, keyword, interaction.guild.id]
          );
        await confirmation.update({
          content: ":white_check_mark: Approved item " + keyword,
          embeds: [embed],
          components: [],
        });
        log(
          interaction.guild,
          "Saved item " +
            keyword +
            " has been approved by " +
            interaction.user.username
        );
      } else if (confirmation.customId === "delete") {
        await db
          .promise()
          .query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [
            interaction.guild.id,
            keyword,
          ]);
        log(
          interaction.guild,
          "Saved item " +
            keyword +
            " has been deleted by " +
            interaction.user.username
        );
        await confirmation.update({
          content: ":x: Deleted item " + keyword,
          //embeds: [embed],
          components: [],
        });
      }
    } catch (e) {
      await response.update({
        embeds: [embed],
        components: [],
      });
    }
  } else {
    interaction.reply({ embeds: [embed], ephemeral: isNotFound });
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
