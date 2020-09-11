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
