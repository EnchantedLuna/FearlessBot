String.prototype.replaceAll = function (search, replacement) {
  let target = this;
  return target.replace(new RegExp(search, "g"), replacement);
};

exports.run = function (message, params, bot, db, level) {
  let changed = params;
  changed = changed.replaceAll("b", ":b:").replaceAll("B", ":b:");
  if (level >= 2) {
    changed = changed.replaceAll("C", ":b:").replaceAll("c", ":b:");
  }
  if (level == 3) {
    let characters = changed.split("");
    for (let i = 0; i < characters.length; i++) {
      if (characters[i].match("[AD-Zad-z]") && Math.random() < 0.1) {
        characters[i] = ":b:";
      }
    }
    changed = characters.join("");
  }
  message.reply(changed);
};
