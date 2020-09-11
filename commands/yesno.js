exports.run = function (message) {
  message.react("👍").then(function () {
    message.react("👎").then(function () {
      message.react("🤷");
    });
  });
};
