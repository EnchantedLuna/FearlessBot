const config = require("./config.json");
const util = require("./util");

exports.checkActiveRole = async function (message, guild, db) {
  if (
    !message.webhookId &&
    message.member &&
    message.channel.guild.id === config.mainServer &&
    !hasRole(message.member, message.channel.guild, "active")
  ) {
    const minutes = await util.getGuildConfig(guild, "active-threshold", db);
    const threshold = 1000 * 60 * minutes;
    let joinDate = message.member.joinedAt;
    let now = new Date();
    let joinTime = now.getTime() - joinDate.getTime();
    if (joinTime > threshold) {
      let role = message.channel.guild.roles.cache.find(
        (role) => role.name === "active"
      );
      message.member.roles
        .add(role)
        .catch(() => console.log("Incorrect perms to add active role"));
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
