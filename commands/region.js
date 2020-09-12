exports.run = function (message, region) {
  const northamerica = message.channel.guild.roles.cache.find(
    (role) => role.name === "northamerica"
  );
  const southamerica = message.channel.guild.roles.cache.find(
    (role) => role.name === "southamerica"
  );
  const europe = message.channel.guild.roles.cache.find(
    (role) => role.name === "europe"
  );
  const asia = message.channel.guild.roles.cache.find(
    (role) => role.name === "asia"
  );
  const africa = message.channel.guild.roles.cache.find(
    (role) => role.name === "africa"
  );
  const oceania = message.channel.guild.roles.cache.find(
    (role) => role.name === "oceania"
  );
  let allRegions = [northamerica, southamerica, europe, asia, africa, oceania];

  if (typeof region == "undefined") {
    message.reply(
      "please specify a region. Available regions are northamerica, " +
        "southamerica, europe, asia, africa, and oceania. Example: ``!setregion europe``"
    );
    return;
  }

  switch (region.toLowerCase()) {
    case "clear":
      message.member.roles.remove(allRegions);
      message.reply("your region has been cleared.");
      break;
    case "america":
    case "northamerica":
      arrayRemove(allRegions, northamerica);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(northamerica));
      message.reply("your region has been set to North America.");
      break;
    case "southamerica":
      arrayRemove(allRegions, southamerica);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(southamerica));
      message.reply("your region has been set to South America.");
      break;
    case "europe":
      arrayRemove(allRegions, europe);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(europe));
      message.reply("your region has been set to Europe.");
      break;
    case "asia":
      arrayRemove(allRegions, asia);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(asia));
      message.reply("your region has been set to Asia.");
      break;
    case "africa":
      arrayRemove(allRegions, africa);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(africa));
      message.reply("your region has been set to Africa.");
      break;
    case "oceania":
      arrayRemove(allRegions, oceania);
      message.member.roles
        .remove(allRegions)
        .then((updated) => updated.roles.add(oceania));
      message.reply("your region has been set to Oceania.");
      break;
    default:
      message.reply(
        "region not recognized. Acceptable values: northamerica, southamerica, europe, asia, africa, oceania, clear."
      );
      break;
  }
};

function arrayRemove(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}
