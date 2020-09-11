const staticData = require("../staticData.json");

exports.run = function (message, args, bot, db) {
  message.channel.send("", {
    embed: {
      description: ":robot: FearlessBot version: " + staticData.version,
    },
  });
};
