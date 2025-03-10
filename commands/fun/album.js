const { EmbedBuilder } = require("discord.js");

const albums = [
  {
    title: "Taylor Swift (Debut)",
    image: "https://tay.rocks/albums/debut.png",
  },
  {
    title: "Fearless (Taylor's Version)",
    image: "https://i.imgur.com/WenkW0I.jpg",
  },
  {
    title: "Speak Now (Taylor's Version)",
    image: "https://i.imgur.com/K8ZVgVV.jpg",
  },
  { title: "Red (Taylor's Version)", image: "https://i.imgur.com/0nUf20J.jpg" },
  {
    title: "1989 (Taylor's Version)",
    image: "https://i.imgur.com/6G6TlkC.png",
  },
  { title: "reputation", image: "https://tay.rocks/albums/reputation.png" },
  { title: "Lover", image: "https://tay.rocks/albums/lover.png" },
  { title: "folklore", image: "https://tay.rocks/albums/folklore.png" },
  { title: "evermore", image: "https://i.imgur.com/BiNIOXH.jpg" },
  {
    title: "Midnights",
    image:
      "https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png",
  },
  {
    title: "The Tortured Poets Department",
    image:
      "https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png",
  },
];

exports.run = function (message, args, bot, db) {
  let answer = albums[Math.floor(Math.random() * albums.length)];
  message.channel.send({
    embeds: [
      new EmbedBuilder()
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
      new EmbedBuilder()
        .setTitle("Random Album")
        .setDescription("You should listen to " + answer.title + ".")
        .setThumbnail(answer.image),
    ],
  });
};
