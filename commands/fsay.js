exports.run = function (message, params) {
  message.channel.send(params);
  if (message.deletable) {
    message.delete();
  }
};
