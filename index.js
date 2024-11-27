const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
// log 남기기

/*

파일 제목 형식
과목_교수_과제명/수업자료명

*/

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

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
  if(msg.document) {
    console.log(msg.document.file_name);
    bot.sendDocument(process.env.CHANNEL_ID,msg.document.file_id);
    bot.sendMessage(process.env.LOG_ID, `${msg.chat.first_name}${msg.chat.last_name}(${msg.chat.username})이/가 ${msg.document.file_name}를 아카이브에 공유하셧습니다.`);
  }
});



bot.on('file',(msg) => {
    bot.sendMessage(chatId, `file`);
})