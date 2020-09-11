const config = require("../config.json");

exports.run = function (message) {
  message.reply(
    config.baseUrl + "fearlessdata.php?server=" + message.channel.guild.id
  );
};
