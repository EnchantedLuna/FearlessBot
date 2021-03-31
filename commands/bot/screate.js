exports.run = function (message, args, bot, db) {
    bot.api.applications(bot.user.id).commands.post({data: {
        name: 'song',
        description: 'Pick a random Taylor Swift song'
    }})
}