const { MessageEmbed } = require("discord.js");

const responses = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes, definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and try again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Very doubtful",
  "lol no",
  "No way",
  "Odds are about the same as you meeting Taylor",
  "The probability is the same as Taylor ever getting back together (i.e. never)",
  "Only if you're a clown :clown:",
];

exports.run = function (message, args, bot, db) {
  let answer = responses[Math.floor(Math.random() * responses.length)];
  return message.channel.send({
    embeds: [
        new MessageEmbed()
            .setTitle(":8ball: 8 Ball")
            .setDescription(answer.toString()),
    ]
  });
};
