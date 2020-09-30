exports.run = async function (message, args, bot, db, roleName) {
  const events = message.channel.guild.roles.cache.find(
    (role) => role.name === roleName
  );
  if (!events) {
    return;
  }
  const rolePing = "<@&" + events.id + "> ";
  events
    .setMentionable(true)
    .then(async function (updated) {
      await sleep(500);
      message.channel.send(rolePing + args).then(async function () {
        await sleep(500);
        events.setMentionable(false);
      });
    })
    .catch(console.error);
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
