exports.run = function (message) {
  let mCount = rand(2, 20);
  let hm = "h";
  for (let i = 1; i <= mCount; i++) {
    hm += "m";
  }
  message.reply(hm);
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
