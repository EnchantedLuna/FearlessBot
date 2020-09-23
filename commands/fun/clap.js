exports.run = function (message, args) {
  message.reply(args.replace(/ /g, " :clap: ") + " :clap:");
};
