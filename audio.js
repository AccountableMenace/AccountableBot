var Discord = require('discord.io');
var fs = require('fs');
var auth = require('./auth.json');

var client = new Discord.Client({
    autorun: true,
    token: auth.token
});

var VCID = "341556741265162242";
var song = "Drama.mp3";

client.on('ready', function() {
    console.log("%s (%s)", client.username, client.id);

    client.joinVoiceChannel(VCID, function(err, events) {
        if (err) return console.error(err);
        events.on('speaking', function(userID, SSRC, speakingBool) {
            console.log("%s is " + (speakingBool ? "now speaking" : "done speaking"), userID );
        });

        client.getAudioContext(VCID, function(err, stream) {
            if (err) return console.error(err);
            fs.createReadStream(song).pipe(stream, {end: false});
            stream.on('done', function() {
                fs.createReadStream(song).pipe(stream, {end: false});
            });
        });
    });
});

