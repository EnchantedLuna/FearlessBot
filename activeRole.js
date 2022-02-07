const config = require("./config.json");
const THREE_HOURS = 10800000;

exports.checkActiveRole = function (message) {
  if (
    message.channel.guild.id === config.mainServer &&
    !hasRole(message.member, message.channel.guild, "active")
  ) {
    let joinDate = message.member.joinedAt;
    let now = new Date();
    let joinTime = now.getTime() - joinDate.getTime();
    if (joinTime > THREE_HOURS) {
      let role = message.channel.guild.roles.cache.find(
        (role) => role.name === "active"
      );
      message.member.roles.add(role)
          .catch(() =>
              console.log("Incorrect perms to add active role")
          );
    }
  }
};

function hasRole(member, guild, roleName) {
  let role = guild.roles.cache.find((role) => role.name === roleName);
  if (role === null) {
    return false;
  }

  return member.roles.cache.some((memberRole) => memberRole.id === role.id);
}
