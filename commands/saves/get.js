const { channelCountsInStatistics } = require("../../util");

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
  const embed = await getItem(
    db,
    interaction.guild.id,
    interaction.channel.id,
    keyword,
    false,
    null
  );
  if (embed.description?.includes("youtube.com/watch")) {
    interaction.reply({
      content: embed.description + "\n" + embed.footer.text,
    });
    return;
  }
  interaction.reply({ embeds: [embed], ephemeral: embed.color === 0xff0000 });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
