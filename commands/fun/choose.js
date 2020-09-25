exports.run = function (message, args, bot, db) {
  let choices = args.split(",");
  if (choices.length > 1) {
    let selectedChoice = choices[Math.floor(Math.random() * choices.length)];
    message.channel.send("", {
      embed: {
        title: "Choosing for " + message.author.tag,
        description: "I pick: " + selectedChoice.trim(),
      },
    });
  }
};
