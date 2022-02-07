const fs = require("fs");
const path = require("path");
const { MessageEmbed } = require("discord.js");
const filePath = "../../fhelp.txt";
exports.run = function (message) {
  fs.readFile(path.resolve(__dirname, filePath), "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }
    message.channel.send({
      embeds: [
          new MessageEmbed()
              .setTitle("FearlessBot Help")
              .setDescription(data.toString())
              .setFooter({
                text: "Commands with (/) also available as slash commands"
              })
      ]
    })
  });
};
