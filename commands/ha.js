exports.run = function (message) {
  let count = rand(2, 15);
  let ha = "";
  for (let i = 1; i <= count; i++) {
    ha += "ha";
  }
  message.reply(ha);
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
