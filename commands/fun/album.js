const { MessageEmbed } = require("discord.js");

const albums = [
  { title: "Taylor Swift", image: "https://i.imgur.com/w0bksSN.jpg" },
  { title: "Fearless", image: "https://i.imgur.com/WenkW0I.jpg" },
  { title: "Speak Now", image: "https://i.imgur.com/TNKbt8Y.jpg" },
  { title: "Red", image: "https://i.imgur.com/0nUf20J.jpg" },
  { title: "1989", image: "https://i.imgur.com/i1QDoZR.jpg" },
  { title: "reputation", image: "https://i.imgur.com/o2v3b7E.jpg" },
  { title: "Lover", image: "https://i.imgur.com/cNnUR0M.jpg" },
  { title: "folklore", image: "https://i.imgur.com/oZvDEky.jpg" },
  { title: "evermore", image: "https://i.imgur.com/BiNIOXH.jpg" },
  {
    title: "Midnights",
    image:
      "https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png",
  },
];

exports.run = function (message, args, bot, db) {
  let answer = albums[Math.floor(Math.random() * albums.length)];
  message.channel.send({
    embeds: [
      new MessageEmbed()
        .setTitle("Random Album")
        .setDescription("You should listen to " + answer.title + ".")
        .setThumbnail(answer.image),
    ],
  });
};

exports.interaction = function (interaction, bot, db) {
  let answer = albums[Math.floor(Math.random() * albums.length)];
  interaction.reply({
    embeds: [
      new MessageEmbed()
        .setTitle("Random Album")
        .setDescription("You should listen to " + answer.title + ".")
        .setThumbnail(answer.image),
    ],
  });
};
