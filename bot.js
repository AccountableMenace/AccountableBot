var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var request = require('xhr-request')
var parseString = require('xml2js').parseString;
var Stream = require('stream');
var fs = require('fs');
var ffmpegPath = '/bin/ffmpeg/ffmpeg.exe'
var FfmpegCommand = require('fluent-ffmpeg');
var heroku = require("heroku");

var lastBotVoiceChannel = "0";


var drama = "Drama.mp3";
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



    //something with ffmpeg
    FfmpegCommand.setFfmpegPath(ffmpegPath);
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `?` 
    if (message.substring(0, 1) == '?') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);

        switch (cmd) {
            // ping
            case 'ping':
                // a way to get bot message id
                bot.sendMessage({
                    to: channelID, /* message: 'aasdf',*/ embed: {
                        color: 6826080,
                        footer: {
                            text: 'Time now is: ' + getTime(true)
                        },
                        title: 'Pong!'
                    }
                }, (err, res) => { if (res != null) { console.log(user + ' pinged, bot msg id: ' + res.id + ", user msg id: " + evt.d.id); } });
                // evt.d.id a way to get user message id


                console.log(getTime() + user + " Pinged me!");

                break;

                //roll dice
            case 'roll':
                if (isNaN(args[0])) {
                    bot.sendMessage({ to: channelID, message: 'Usage: roll [Max number]' });
                    console.log(getTime() + user + ' failed to roll a number with args: ' + args);
                }
                else {
                    var nmb = Math.floor(1 + Math.random() * args[0]);
                    bot.sendMessage({ message: user + ' rolled ' + nmb, to: channelID });
                    console.log(getTime() + user + ' rolled ' + nmb + ' with args: ' + args);
                }

                break;

                //resends the message
            case 'relay':
                var relayMsg = message.substring(7);
                var resid;
                //send message, wait for completion ( => ), then delete message that the user just sent xd
                bot.sendMessage({ message: relayMsg, to: channelID });
                bot.deleteMessage({ channelID: channelID, messageID: evt.d.id });
                console.log(getTime() + user + ' relayed: ' + relayMsg);


                break;

                //meme from reddit /r/meirl hot section
            case 'meme':
                console.log(getTime() + user + " Posted a meme");
                if (args[0] == null) {
                    var rnd = Math.floor(Math.random() * 75);
                }
                else if (args[0] >= 0 || args[0] < 75) {
                    rnd = args[0];
                }
                getRSS("https://www.reddit.com/r/dankmemes/top/.rss?sort=top&t=day&limit=75", function (result) {

                    try {
                        var htmlEnding = JSON.stringify(result["feed"]["entry"][rnd]["content"]);
                    }
                    catch (e) {
                        console.log(getTime() + "And it failed!... " + user + "  Managed to fail a meme post with args: " + args);
                        return 1;
                    }
                    var indexHtmlEnding = htmlEnding.indexOf("<span>");
                    htmlEnding = htmlEnding.toString().substr(16 + indexHtmlEnding);
                    indexHtmlEnding = htmlEnding.indexOf("[link]");
                    htmlEnding = htmlEnding.substr(0, indexHtmlEnding - 3);
                    console.log(getTime() + "link: " + htmlEnding);
                    bot.sendMessage({ message: htmlEnding, to: channelID });
                });
                break;
            case 'voice':
                if (args[0] == 'join') {
                    //get voice channel id
                    botServerId = bot.channels[channelID].guild_id;
                    //to string
                    var UserVoiceChannelId = JSON.stringify(bot['servers'][botServerId]["members"][userID]["voice_channel_id"]);
                    //cut off ' " " from start and end
                    UserVoiceChannelId = UserVoiceChannelId.substring(1, UserVoiceChannelId.length - 1)

                    lastBotVoiceChannel = UserVoiceChannelId;
                    //try joining the channel
                    bot.joinVoiceChannel(UserVoiceChannelId, function (error, events) {
                        if (error) { console.log(getTime() + error); }
                        else { console.log(getTime() + "Bot joined a voice channel"); }
                    });

                }
                else if (args[0] == 'leave') {

                    bot.leaveVoiceChannel(lastBotVoiceChannel, function (error, events) {
                        if (error) { console.log(getTime() + error); }
                        else { console.log(getTime() + "Bot left a voice channel"); }
                    });

                }
                else if (args[0] == "play") {
                    playAudio(lastBotVoiceChannel, args[1]);
                }
                break;
            case 'test':
                console.log(getTime() + "TEST");

                break;


        }
    }
});


function playAudio(voiceChannel, source) {


    console.log(getTime() + "Trying to play audio from source " + source);
    //get the audio context
    bot.getAudioContext(voiceChannel, function (error, stream) {
        if (error) console.log(getTime() + error);
        else {
            console.log(getTime() + Json.stringify(stream));
            //Create a stream to your file and pipe it to the stream
            //Without {end: false}, it would close up the stream, so make sure to include that.  
            fs.createReadStream("Drama.mp3").pipe(stream, { end: false });
        }  
    });



}


function getTime(noEnding) {
    var date = new Date();
    //var currenttime = date.getFullYear() + "/" +
    //                  date.getMonth() + "/" +
    //                  date.getDate() + " " +
    //                  date.getHours() + ":" +
    //                  date.getMinutes() + ":" +
    //                  date.getSeconds();
    var currenttime = date.toLocaleTimeString();
    if (noEnding != true) {
        currenttime += " >>> "
    }
    return currenttime;
}

function getRSS(Url, fn) {

    //xmlhttprequest
    request(Url, {
        xml: true
    }, function (err, data) {
        if (err) { throw err; }

        // the result is var data

        //parse xml to js using xml2js node
        parseString(data, function (err, result) {

            fn(result);

        });

    });
}


//EMBED EXAMPLE

/*

client.sendMessage({
  to: channelID,
  message: '', // You can also send a message with the embed.
  embed: {
    color: 6826080,
    footer: { 
      text: ''
    },
    thumbnail:
    {
      url: ''
    },
    title: '',
    url: ''
  }
});

*/