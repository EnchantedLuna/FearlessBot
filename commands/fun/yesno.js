exports.run = function (message) {
  message.react("👍")
      .then(() => message.react("👎"))
      .then(() => message.react("🤷"));
};
