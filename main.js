const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();
var fs = require('fs');

const imgDir = './testfiles/'
const positiveDir = './testfiles/rated/positive/'
const negativeDir = './testfiles/rated/negative/'

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


// check if folders exist, if not, recursively create them

if (!fs.existsSync(positiveDir)) {
  fs.mkdir(positiveDir, {
    recursive: true
  }, (err) => {
    if (err) throw err;
  });
}

if (!fs.existsSync(negativeDir)) {
  fs.mkdir(negativeDir, {
    recursive: true
  }, (err) => {
    if (err) throw err;
  });
}


// start main code body
// when message has been sent..

client.on('message', async message => {

  if (message.content === config.prefix + 'start') { // check for command 'start'

    sendImg();

    async function sendImg() {

      // read dir and add all files to array 'files'
      var filedir = fs.readdirSync(imgDir, {
        withFileTypes: true
      });
      var files = filedir
        .filter(filedir => filedir.isFile())
        .map(filedir => filedir.name);

      // choose a random file from 'files' array
      var chosenFile = files[Math.floor(Math.random() * files.length)]

      // try and send message with image
      try {
        var reactionMessage = await message.channel.send({
          files: [imgDir + chosenFile]
        });
      }

      // if message send fails, log error and send error message
      catch (err) {
        if (err.code === 'ENOENT') {
          console.log('File not found!');
          console.log(err);
          message.channel.send('No files available, or file retreval failed. (error code ENOENT)');
          return;
        } else {
          throw err;
        }
      }

      // add reactions to message
      await reactionMessage.react('👍').then(() => reactionMessage.react('👎'));
      const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;
      };

      // check for reactions to message, or wait until 60s passes then timeout
      reactionMessage.awaitReactions(filter, {
          max: 1,
          time: 60000,
          errors: ['time']
        })
        .then(collected => {
          const reaction = collected.first();

          if (reaction.emoji.name === '👍') { // thumbs up reaction
            fs.rename(imgDir + chosenFile, positiveDir + chosenFile, function (err) {
              if (err) throw err
              message.reply('Successfully moved file to positive directory.');
              sendImg();
            })

          } else { // thumbs down reaction
            fs.rename(imgDir + chosenFile, negativeDir + chosenFile, function (err) {
              if (err) throw err
              message.reply('Successfully moved file to negative directory.');
              sendImg();
            })
          }
        })
        .catch(collected => { // timeout
          message.reply('You did not react within the given time, therefore, the process has ended.');
          return;
        });

    }
  }

  if (message.content === config.prefix + 'download') {
    message.reply('Not implemented yet.')
  }
});

client.login(config.token); // bot token
