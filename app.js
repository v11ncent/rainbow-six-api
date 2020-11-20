//import
const Discord = require('discord.js');
const client = new Discord.Client();

//Ubisoft requires you to login to view their stats(don't ask me why)
//Likewise, in order to view people's stats, you must provide a valid email/password
const email = '';
const password = ''  ;

var username = 'OryxGaming_';

client.on('ready', () => {
    console.log('Ready...');
});

client.on('message', message => {
    if (message.content === '!lookup') {
        message.channel.send('***Enter the username: !lookup username***');
    }
    
    if (message.content.includes('!lookup')) {
        full_message = message.content;
        parsed_message = message.content.split(' ');
        var username = parsed_message[1];
        //somefunction.xyz(param1,param2);
    }
});

function display() {
    //xyz
}

module.exports.email = email;
module.exports.password = password;
module.exports.username = username;
