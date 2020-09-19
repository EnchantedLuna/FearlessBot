const fs = require("fs");
const path = require("path");
const filePath = "../fhelp.txt";
exports.run = function (message) {
  fs.readFile(path.resolve(__dirname, filePath), "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }
    message.channel.send("", {
      embed: { title: "FearlessBot Help", description: data },
    });
  });
};
