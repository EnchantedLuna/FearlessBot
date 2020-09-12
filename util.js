const config = require("./config.json");

exports.channelCountsInStatistics = function (guild, channel) {
  return (
    guild != config.mainServer || config.statCountingChannels.includes(channel)
  );
};

exports.isMod = function (member, guild) {
  if (typeof member === "string") {
    member = guild.members.cache.get(member);
    if (typeof member === "undefined") {
      return false;
    }
  }
  return (
    exports.hasRole(member, guild, "mods") || member.id == config.botAdminUserId
  );
};

exports.hasRole = function (member, guild, roleName) {
  let role = guild.roles.cache.find((role) => role.name === roleName);
  if (role === null) {
    return false;
  }

  return member.roles.cache.some((memberRole) => memberRole.id === role.id);
};

exports.log = function (guild, message) {
  let logChannel = guild.channels.cache.find(
    (channel) => channel.name === "log"
  );
  if (logChannel) {
    logChannel.send(message);
  }
};

exports.hasPermission = function (user, permission) {
  switch (permission) {
    case "all":
      return true;
    case "mods":
      return exports.isMod(user, user.guild);
    case "mainServerMods":
      return (
        exports.isMod(user, user.guild) && user.guild.id === config.mainServer
      );
    case "admin":
      return user.id === config.botAdminUserId;
    default:
      return false;
  }
};
