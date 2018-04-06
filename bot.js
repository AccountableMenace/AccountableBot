var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `?`
    if (message.substring(0, 1) == '?') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);

        switch (cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({ to: channelID, message: 'Pong!' });
                console.log(user + ' pinged');
                break;

                //roll dice
            case 'roll':
                if (typeof (args[0] != 'number')) { bot.sendMessage({ to: channelID, message: 'Usage: roll [Max number]'}); }
                else if (typeof (args[0] == 'number')) { bot.sendMessage({ message: user + ' rolled ' + Math.floor(1 + Math.random() * args[0]), to: channelID }); }
                console.log(user + ' rolled a number');
                break;

                //resends the message
            case 'relay':
                var relayMsg = message.substring(7);
                bot.sendMessage({ message: relayMsg, to: channelID });
                console.log(user + ' relayed: ' + relayMsg);
                
                break;

                //test
            case 'test':
                //bot.sendMessage({ message: user + '\n' + userID + '\n' + channelID + '\n' + message + '\n' + evt + '\n' + connection, to: channelID });
                
                //bot.sendMessage({ message: '@' + userID, to: channelID });
                
                bot.getMessage({ channelID: channelID, messageID: '431924460594003968' });
                console.log(bot.getMessage({ channelID: channelID, messageID: '431924460594003968' }));
                //bot.sendMessage({ message: testmsg, to: channelID });
                //console.log(user + " Used Test" + testmsg);
                break;
              
        }
    }
});



