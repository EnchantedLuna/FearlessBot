const { log, escapeText } = require("../../util");
const { EmbedBuilder } = require("discord.js");

exports.run = function (message, args, bot, db) {
  let pieces = args.split(" ");
  let number = parseInt(pieces[0]);
  let list = [];

  if (isNaN(number)) {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            ":x: You must enter a valid number of lorpoints to add.\nUsage: ``!alp [number] @user1 @user2``"
          )
          .setColor(0xff0000),
      ],
    });
    return;
  }

  if (number > 1000000 || number < -10000000) {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(":x: This amount is too high!")
          .setColor(0xff0000),
      ],
    });
    return;
  }

  if (message.mentions.members.size === 0) {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(":x: You must mention a member to add lorpoints to.")
          .setColor(0xff0000),
      ],
    });
    return;
  }

  message.mentions.members.forEach(function (member, key, map) {
    db.query(
      "UPDATE members SET lorpoints=lorpoints+? WHERE server = ? AND id = ?",
      [number, message.channel.guild.id, member.id]
    );
    db.query(
      "INSERT INTO lorpoint_log (guild, user, amount, time, description) VALUES (?, ?, ?, now(), null)",
      [message.channel.guild.id, member.id, number]
    );
    list.push(escapeText(member.user.username));
  });
  let finalList = list.join(", ");
  let userCount = list.length;
  let lorpointWord = number !== 1 ? "lorpoints" : "lorpoint";
  message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(":star: Adding Lorpoints")
        .setDescription(
          number + " " + lorpointWord + " have been added to:\n" + finalList
        )
        .setColor(0xdbe07e)
        .setFooter({ text: "Total users: " + userCount }),
    ],
  });
  if (number !== 0) {
    log(
      message.channel.guild,
      number +
        " " +
        lorpointWord +
        " have been awarded to: " +
        finalList +
        " by " +
        message.author.username
    );
  }
};

exports.interaction = function (interaction, bot, db) {
  const amount = interaction.options.getInteger("amount");
  const users = interaction.options.resolved.members;
  const description = interaction.options.getString("description");
  const list = [];

  if (amount > 1000000 || amount < -10000000) {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(":x: This amount is too high!")
          .setColor(0xff0000),
      ],
    });
    return;
  }

  if (users.size === 0) {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(":x: You must mention a member to add lorpoints to.")
          .setColor(0xff0000),
      ],
    });
    return;
  }

  users.forEach(function (member, key, map) {
    db.query(
      "UPDATE members SET lorpoints=lorpoints+? WHERE server = ? AND id = ?",
      [amount, interaction.guild.id, member.id]
    );
    db.query(
      "INSERT INTO lorpoint_log (guild, user, amount, time, description) VALUES (?, ?, ?, now(), ?)",
      [interaction.guild.id, member.id, amount, description]
    );
    list.push(escapeText(member.user.username));
  });
  let finalList = list.join(", ");
  let userCount = list.length;
  let lorpointWord = amount !== 1 ? "lorpoints" : "lorpoint";
  interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(":star: Adding Lorpoints")
        .setDescription(
          amount + " " + lorpointWord + " have been added to:\n" + finalList
        )
        .setColor(0xdbe07e)
        .setFooter({ text: "Total users: " + userCount }),
    ],
  });
  if (amount !== 0) {
    log(
      interaction.guild,
      amount +
        " " +
        lorpointWord +
        " have been awarded to: " +
        finalList +
        " by " +
        interaction.user.username
    );
  }
};
