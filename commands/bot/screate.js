const commands = require('../../commands.json');

exports.run = function (message, args, bot, db, globalScope) {
    if (args in commands) {
        const scope = (globalScope) ? bot.application.commands : bot.guilds.cache.get(message.channel.guild.id).commands;
        if (commands[args].interactionCreate) {
            void scope.create(commands[args].interactionCreate);
        }
    }
}
