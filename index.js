const TelegramBot = require('node-telegram-bot-api');


// log 남기기
// file handling
// list 

// replace the value below with the Telegram token you receive from @BotFather
const token = '7668501773:AAFYORZyVJfeXkPH3OTArsu0GhvvjP8wJ_A';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
  bot.sendMessage(-1002274686707, 'Hello World!');
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg.chat.id);
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, `${msg.chat}`);
  //bot.sendMessage(-1002274686707, "test");
 // bot.sendDocument(-1002274686707,"");
});

bot.on('file',(msg) => {
    bot.sendMessage(chatId, `file`);
})