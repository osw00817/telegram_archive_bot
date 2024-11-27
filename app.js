const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const uri = `mongodb+srv://SANJINI:${process.env.DB_PASSWORD}@cluster.dfgw5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function getList() {
    try {
      await client.connect();
      const database = client.db("archive");
      const collection = database.collection("archive_list");
  
      const documents = await collection.find({}).toArray();
  
      const organizedData = documents.reduce((acc, doc) => {
        const { course, professor, title } = doc;
        const entry = `${course}_${professor}_${title}`;
        if (!acc[course]) {
          acc[course] = [];
        }
        acc[course].push(entry);
        return acc;
      }, {});
      
      let msg = "산지니 아카이브는 제보로 운영되고있습니다.\n제보봇: @PNU_archive_bot\n파일명: 과목명_교수명_과제또는자료제목\n\n\n";
      for (const [course, entries] of Object.entries(organizedData)) {
        msg += `[${course}]\n`;
        entries.forEach(entry => {
          msg += `${entry}\n`;
        });
        msg += `\n`;
      }
      msg += `\n`;
      msg += `\n`;

      //console.log(msg);
      return msg;
    } catch (error) {
      console.error("Error fetching and organizing documents:", error);
    } finally {
      await client.close();
    }
  }


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
bot.onText(/\/notice (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  
  bot.sendMessage(process.env.CHANNEL_ID_ID,resp);
});

// Listen for any kind of message. There are different kinds of
// messages.

const userStates = {};

bot.on('message', async (msg) => {
    // 공지 메세지 추가
    /*
    bot.sendMessage(process.env.CHANNEL_ID, '공지 메세지').then((sentedmessage) => {
        console.log(sentedmessage.message_id);
    })
    */

    const username = msg.chat.username || `${msg.chat.first_name}${msg.chat.last_name}`;
    const notice = 8;
    
    if(userStates[username]?.state === 'await') {
      const text = msg.text;
      const {filename} = userStates[username];
      bot.sendMessage(process.env.CHANNEL_ID,`${filename}\n제보자 분의 한마디:${text}`);
      bot.sendMessage(msg.chat.id,"소중한 제보 감사드립니다.");
      
      delete userStates[username];
      return;
    } 
    
    if(msg.chat.id != process.env.CHANNEL_ID && msg.chat.id != process.env.LOG_ID) {
        if(msg.document) {
            const regex = /^[^_]+_[^_]+_[^_]+$/;
            const filename = msg.document.file_name; 
            if(regex.test(filename)) {
                console.log(filename);
                const parts = filename.split('_');
                const course = parts[0];
                const professor = parts[1];
                const title = parts[2];
        
                console.log(`과목명:${course}`);
                console.log(`교수명:${professor}`);
                console.log(`제목:${title}`);
                bot.sendDocument(process.env.CHANNEL_ID,msg.document.file_id);
                bot.sendMessage(process.env.LOG_ID, `${msg.chat.first_name}${msg.chat.last_name}(${msg.chat.username})이/가 ${filename}를 아카이브에 공유하셧습니다.`);
        
                try {
                    await client.connect();
                    const database = client.db("archive");
                    const collection = database.collection("archive_list");
                
                    const document = { course, professor, title };
                    const result = await collection.insertOne(document);
                    bot.sendMessage(process.env.LOG_ID,`${result.insertedId}로 db에 추가되었습니다.`);
                  } catch (error) {
                    bot.sendMessage(process.env.LOG_ID,`${error}`);
                  } finally {
                    await client.close();
                  }
                
                const notice_msg = await getList();
                bot.editMessageText(`${notice_msg}`,{
                    chat_id: process.env.CHANNEL_ID,
                    message_id: notice
                })

                userStates[username] = {
                  state: 'await',
                  filename: filename,
                };

                bot.sendMessage(msg.chat.id,"제보자의 한마디를 입력해주세요.");
                
            } else {
                bot.sendMessage(msg.chat.id,`파일명을 과목명_교수명_제목 으로 입력해주세요`);
            }
          } else {
            bot.sendMessage(msg.chat.id,"파일 형식으로 보내주세요.");
          }
    }
});