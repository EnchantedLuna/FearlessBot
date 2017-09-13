// Bot admin commands

function fsayCommand(message, params)
{
    message.channel.send(params);
    message.delete();
}
