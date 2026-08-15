exports.interaction = async function (interaction, bot, db) {
  const message = interaction.options.getString("message");
  const role = interaction.options.getRole("role");
  if (!role) {
    interaction.reply(":x: I could not find the " + roleName + " role.");
    return;
  }
  if (!role.editable) {
    interaction.reply(":x: I do not have permission to edit this role.");
    return;
  }
  const rolePing = "<@&" + role.id + "> ";
  role
    .setMentionable(true)
    .then(async function (updated) {
      await sleep(500);
      interaction.reply(rolePing + message).then(async function () {
        await sleep(500);
        role.setMentionable(false);
      });
    })
    .catch(console.error);
};
