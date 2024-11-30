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
      
      let msg = "[공지사항]\n산지니 아카이브는 익명의 제보로 운영되고있습니다.\n제보봇: @PNU_archive_bot\n파일명: 과목명_교수명_자료제목\n※산지니 아카이브 구독자 외 사람들에게 공유를 금합니다.\n※파일 제보 및 문제 신고 방법은 따봉산지니에서 /help 명령어를 통해 확인하실수있습니다.\n\n";
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
      console.error("Error:", error);
    } finally {
      await client.close();
    }
  }

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/help/, (msg, match) => {  
  bot.sendMessage(msg.chat.id,'[제보방법]\n1. /submit 과목명_교수명_제목\n2. 제보자의 한마디 입력(필수X)\n3.파일 제출\n\n[신고 방법]\n1. /report 신고할내용\n');
});

bot.onText(/\/notice (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; 
  
  bot.sendMessage(process.env.CHANNEL_ID,resp);
});


bot.onText(/\/report (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; 
  
  bot.sendMessage(process.env.LOG_ID,`[신고]\n${resp}`);
});


const userStates = {};

bot.onText(/\/submit (.+)/, (msg, match) => {

  const resp = match[1];
  const username = msg.chat.username || `${msg.chat.first_name}${msg.chat.last_name}`;
  const regex = /^[^_]+_[^_]+_[^_]+$/;

  if(regex.test(resp)) {
    console.log(resp);
    userStates[username] = {
      state: 'TLQKF',
      filename: resp,
      comment: 'X'
    };
    bot.sendMessage(msg.chat.id,`제보자의 한마디를 입력해주세요.\n입력을 원치 않으시면 대문자 X를 입력해주세요.`);
  } else {
    bot.sendMessage(msg.chat.id,`과목명_교수명_파일명\n형식 확인 부탁드립니다.`);
  }
});

bot.on('message', async (msg) => {
    // 공지 메세지 추가
    /*
    bot.sendMessage(process.env.CHANNEL_ID, '공지 메세지').then((sentedmessage) => {
        console.log(sentedmessage.message_id);
    })
    */
    if(msg.chat.id == process.env.CHANNEL_ID || msg.chat.id == process.env.LOG_ID) 
      return;

    const username = msg.chat.username || `${msg.chat.first_name}${msg.chat.last_name}`;
    const notice = 8;

    if(userStates[username]?.state === 'TLQKF') {
      const text = msg.text;
      if(text != 'X') {
        userStates[username].comment = text;
      }
      userStates[username].state = 'TLQKFTLQKF';
      bot.sendMessage(msg.chat.id,"파일을 보내주세요.");
      return;
    } 
    
    if(msg.document && userStates[username]?.state === 'TLQKFTLQKF') {
      userStates[username] === 'TLQKFTLQKFTLQKF';
      const {filename,comment} = userStates[username];
      delete userStates[username];
      console.log(filename);

      const parts = filename.split('_');
      const course = parts[0];
      const professor = parts[1];
      const title = parts[2];

      console.log(`과목명:${course}`);
      console.log(`교수명:${professor}`);
      console.log(`제목:${title}`);

      // 개발용 로그 
      bot.sendMessage(process.env.LOG_ID, `${filename}를 아카이브에 되었습니다.`);

      //database에 목록 추가
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

        //파일 넘기기 및 메세지 출력
        bot.sendDocument(process.env.CHANNEL_ID, msg.document.file_id,{caption : `${filename}`})
        .then(() => {
          return getList();
        })
        .then((notice_msg) => {
          bot.editMessageText(`${notice_msg}`, {
            chat_id: process.env.CHANNEL_ID,
            message_id: notice,
          });
         
          if(comment != "X"){
            bot.sendMessage(process.env.CHANNEL_ID,`제보자의 한마디:${comment}`);
          }
          bot.sendMessage(msg.chat.id,"소중한 제보 감사드립니다.");
        })
        .catch((error) => {
          bot.sendMessage(process.env.LOG_ID,`${error}`);
          bot.sendMessage(msg.chat.id,"오류가 발생하였습니다. 죄송합니다.");
        });
    }
    else if(userStates[username]?.state === 'TLQKFTLQKF') {
      bot.sendMessage(msg.chat.id,"파일 형식으로 보내지 않아 취소되었습니다.\n 제보를 원하실경우, 처음부터 다시해주세요.");
      delete userStates[username];
    }
});