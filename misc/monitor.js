const config = require("../config.json");
const Discord = require("discord.js");
const staticData = require("../staticData.json");

var bot = new Discord.Client({ disableEveryone: true, fetchAllMembers: true });

bot.on("ready", () => {
  console.log("monitor script is ready");
});

bot.on("messageReactionAdd", function (reaction, user) {
  console.log(user.id + " " + user.tag + " " + reaction.emoji.name);
  console.log(reaction.message.cleanContent);
  console.log("---");
});

bot.login(config.token);
