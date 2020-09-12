const package = require("../package.json");

exports.run = function (message, args, bot, db) {
  message.channel.send("", {
    embed: {
      description: ":robot: FearlessBot version: " + package.version,
    },
  });
};
