const { Message, Client } = require("discord.js");
const config = require("./config.json");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const settings = {
  prefix: { default: "!", type: "string" },
  "lorpoint-cap": { default: 4, type: "int" },
  "event-lorpoints": { default: 2, type: "int" },
  "active-threshold": { default: 60, type: "int" },
  "leave-threshold": { default: 0, type: "int" },
};

exports.channelCountsInStatistics = async function (guildId, channelId, db) {
  const cachedValue = cache.get("spam-" + channelId);
  if (cachedValue !== undefined) {
    return cachedValue != 1;
  }
  const [result] = await db
    .promise()
    .query(
      "SELECT is_spam FROM channel_stats WHERE `server`=? AND `channel`=?",
      [guildId, channelId]
    );
  if (result[0]) {
    cache.set("spam-" + channelId, result[0].is_spam);
    return result[0].is_spam != 1;
  }
  cache.set("spam-" + channelId, 0);
  return true;
};

exports.isCommandBlocked = async function (guildId, channelId, db, command) {
  const cachedValue = cache.get("blocked-" + channelId);
  if (cachedValue !== undefined) {
    const blockedList = cachedValue.split(",");
    return command in blockedList;
  }
  const [result] = await db
    .promise()
    .query(
      "SELECT blocked_commands FROM channel_stats WHERE `server`=? AND `channel`=?",
      [guildId, channelId]
    );
  if (result[0]) {
    const blocked = result[0].blocked_commands;
    const blockedList = blocked.split(",");
    cache.set("blocked-" + channelId, result[0].blocked_commands);
    return command in blockedList;
  }
  cache.set("blocked-" + channelId, "");
  return false;
};

exports.isMod = function (member, guild) {
  if (typeof member === "string") {
    member = guild.members.cache.get(member);
  }
  if (typeof member === "undefined") {
    return false;
  }
  return (
    exports.hasRole(member, guild, "mods") ||
    member.id === config.botAdminUserId
  );
};

exports.hasRole = function (member, guild, roleName) {
  const role = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === roleName
  );
  if (!role) {
    return false;
  }

  return member.roles.cache.some((memberRole) => memberRole.id === role.id);
};

exports.log = function (guild, message) {
  let logChannel = guild.channels.cache.find(
    (channel) => channel.name === config.logChannelName
  );
  if (!logChannel) {
    logChannel = guild.channels.cache.find((channel) => channel.name === "log");
  }
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

/**
 *
 * @param {Message} message
 * @param {string} args
 * @param {Client} bot
 */
exports.findMemberID = function (message, args, bot) {
  let memberId = message.author.id;
  if (message.mentions.members.size > 0) {
    return message.mentions.members.first().user.id;
  }
  const idResolve = bot.users.resolve(args);
  if (idResolve) {
    return idResolve.id;
  }
  const guildMember = message.channel.guild.members.cache.find(
    (member) =>
      member.user.username.toLowerCase() === args.toLowerCase() ||
      member.user.tag === args
  );
  if (guildMember) {
    return guildMember.id;
  }

  return memberId;
};

/**
 *
 * @param {Message} message
 * @param {string} args
 * @param {Client} bot
 */
exports.findMember = async function (message, args, bot) {
  let member = message.member;
  if (message.mentions.members.size > 0) {
    return message.mentions.members.first();
  }

  const couldBeId = args.match(/^\d+$/);
  if (couldBeId) {
    try {
      const idResolve = await message.channel.guild.members.fetch(args);
      if (idResolve) {
        return idResolve;
      }
    } catch (err) {}
  }
  const guildMember = message.channel.guild.members.cache.find(
    (member) =>
      member.user.username.toLowerCase() === args.toLowerCase() ||
      member.user.tag === args
  );
  if (guildMember) {
    return guildMember;
  }

  return member;
};

exports.getGuildConfig = async function (guild, key, db) {
  const cacheValue = cache.get(guild + key);
  if (cacheValue !== undefined) {
    return cacheValue;
  }
  const [result] = await db
    .promise()
    .query("SELECT * FROM guild_config WHERE `guild`=? AND `key`=?", [
      guild,
      key,
    ]);
  if (result[0] && result[0].value !== null) {
    let value = result[0].value;
    if (settings[key].type == "int") {
      value = parseInt(value);
    }
    cache.set(guild + key, value);
    return value;
  }
  cache.set(guild + key, settings[key].default);
  return settings[key].default;
};

exports.setGuildConfig = function (guild, key, value, db) {
  db.query(
    "REPLACE INTO guild_config (`guild`, `key`, `value`) VALUES (?,?,?)",
    [guild, key, value]
  );
  cache.set(guild + key, value);
};

exports.getAllGuildConfig = async function (guild, db) {
  const values = {};
  for (const setting in settings) {
    values[setting] = await exports.getGuildConfig(guild, setting, db);
  }
  return values;
};

exports.clearCacheValue = function (key) {
  cache.del(key);
};
