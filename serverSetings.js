const NodeCache = require("node-cache");
const cache = new NodeCache();
const config = require("config.json");
const defaults = {
    cap: 3,
    prefix: config.prefix
};

exports.getGuildValue = function(guildId, db, field) {
    let guildSettings = cache.get(guildId);
    if (guildSettings instanceof Object) {
        return guildSettings[field];
    }

    const value = getDBValue(guildId, db, field);
    return cache.set(guildId, value);
};

function getDBValue(guildId, db, field) {
    db.query("SELECT * FROM guild_settings WHERE id = ?", [guildId], function (err, rows) {
        if (err) {
            console.error(err);
            return defaults[field];
        }
        if (rows[0]) {
            return rows[0][field];
        }
        db.query("INSERT INTO guild_settings (id) VALUES(?)", [guildId]);
        return defaults[field];
    });
}