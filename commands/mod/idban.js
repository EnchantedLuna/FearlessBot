const { isMod } = require("../../util");

exports.run = function (message, userId) {
  if (isMod(userId, message.channel.guild)) {
    message.channel.send(":smirk:");
  } else {
    message.channel.guild.members
      .ban(userId)
      .then((user) => {
        message.channel.send({
          embeds: [{
            description: `:hammer: Banned ${user.username || user.id || user}.`,
          }],
        });
      })
      .catch((error) => {
        message.channel.send(
          ":no_entry: There was an error executing this operation."
        );
      });
  }
};
