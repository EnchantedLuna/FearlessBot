const util = require("./util");

function runScheduledActions(bot, db) {
  db.query(
    "SELECT scheduled_actions.*, members.username FROM scheduled_actions \
    JOIN members ON members.server=scheduled_actions.guild AND scheduled_actions.user=members.id \
    WHERE completed=0 AND effectivetime < NOW() ORDER BY id",
    [],
    function (err, rows) {
      for (let i = 0; i < rows.length; i++) {
        let guild = bot.guilds.cache.get(rows[i].guild);
        if (typeof guild == "undefined") {
          console.log(
            "Scheduled actions: Guild " + rows[i].guild + " not found."
          );
          continue;
        }
        let member;
        switch (rows[i].action) {
          case "unmute":
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            let supermute = guild.roles.cache.find(
              (role) => role.name === "supermute"
            );
            if (typeof supermute == "undefined") {
              console.log(
                "Scheduled actions: Supermute role not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            member = guild.members.cache.get(rows[i].user);
            if (typeof member == "undefined") {
              util.log(
                guild,
                "Warning: " +
                  rows[i].username +
                  " was scheduled to be unmuted, but this member was not found. Have they left?"
              );
              db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
                rows[i].id,
              ]);
              continue;
            }
            member.roles.remove(supermute);
            util.log(guild, member.user.username + "'s supermute has expired.");
            break;
          case "removerole":
            let role = guild.roles.cache.find(
              (role) => role.id === rows[i].roleid
            );
            if (typeof role == "undefined") {
              console.log(
                "Scheduled actions: Role id " +
                  rows[i].roleid +
                  " not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            guild.members
              .fetch(rows[i].user)
              .then((member) => {
                member.roles.remove(role);
                util.log(
                  guild,
                  member.user.username +
                    "'s " +
                    role.name +
                    " role has expired."
                );
                db.query(
                  "UPDATE scheduled_actions SET completed=1 WHERE id=?",
                  [rows[i].id]
                );
              })
              .catch(() => {
                util.log(
                  guild,
                  "Warning: " +
                    rows[i].username +
                    " was scheduled to have the " +
                    role.name +
                    " role removed, but this member was not found. Have they left?"
                );
                db.query(
                  "UPDATE scheduled_actions SET completed=1 WHERE id=?",
                  [rows[i].id]
                );
              });

            break;
          case "unban":
            guild.members.unban(rows[i].user);
            util.log(guild, rows[i].username + "'s ban has expired.");
            db.query("UPDATE scheduled_actions SET completed=1 WHERE id=?", [
              rows[i].id,
            ]);
            break;
        }
      }
    }
  );
}
exports.runScheduledActions = runScheduledActions;

exports.validateMutes = function (member, bot, db) {
  db.query(
    "SELECT * FROM scheduled_actions WHERE guild = ? AND user = ? AND effectivetime > NOW() AND completed = 0 AND action IN ('unmute', 'removerole')",
    [member.guild.id, member.id],
    function (err, rows) {
      for (let i = 0; i < rows.length; i++) {
        let guild = bot.guilds.cache.get(rows[i].guild);
        switch (rows[i].action) {
          case "unmute":
            let supermute = guild.roles.cache.find(
              (role) => role.name === "supermute"
            );
            if (typeof supermute == "undefined") {
              console.log(
                "Scheduled actions: Supermute role not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            member.roles.add(supermute);
            util.log(
              guild,
              member.user.username +
                " has joined and has an active supermute. Supermute role added."
            );
            break;
          case "removerole":
            let role = guild.roles.cache.find(
              (role) => role.id === rows[i].roleid
            );
            if (typeof role == "undefined") {
              console.log(
                "Scheduled actions: " +
                  rows[i] +
                  " role not found in guild " +
                  rows[i].guild
              );
              continue;
            }
            member.roles.add(role);
            util.log(
              guild,
              member.user.username +
                " has joined and has an active " +
                role.name +
                " role. This role has been re-added."
            );
            break;
        }
      }
    }
  );
};
