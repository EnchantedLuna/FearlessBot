const { log } = require("../../util");

exports.run = function (message) {
  let mods = message.channel.guild.roles.cache.find(
    (role) => role.name === "mods"
  );
  if (mods === "undefined") {
    return;
  }
  let joinDate = message.member.joinedAt;
  let now = new Date();
  let joinTime = (now.getTime() - joinDate.getTime()) / 1000;
  if (joinTime < 60 * 60 * 24 * 14) {
    message.reply(
      "this command can only be used by members who have joined more than 2 weeks ago."
    );
    return;
  }

  if (!mods.editable) {
    message.reply("Error: I don't have permission to edit the mods role.");
    return;
  }
  
  mods.setMentionable(true, "activated by " + message.author.username);
  log(
    message.channel.guild,
    "Mods tag activated by " + message.author.username
  );
  message.reply(
    "the mods tag has activated. Do not continue if this is not a serious issue that needs attention and no mods are currently active. " +
      "Otherwise, use the tag quickly, as it will be disabled in 2 minutes."
  );
  setTimeout(function () {
    mods.setMentionable(false);
    log(message.channel.guild, "Mods tag deactivated.");
  }, 120000);
};
