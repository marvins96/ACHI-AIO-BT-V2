
const axios = require("axios");

const status = require("../utils/status");
const diskinfo = require("../utils/diskinfo");
const humanTime = require("../utils/humanTime");
const { uploadFileStream } = require("../utils/gdrive");

const api = process.env.SEARCH_SITE || "https://torrent-aio-bot.herokuapp.com/";
console.log("Using api: ", api);

const searchRegex = /\/search (piratebay|limetorrent|1337x) (.+)/;
const detailsRegex = /\/details (piratebay|limetorrent|1337x) (.+)/;
const downloadRegex = /\/download (.+)/;
const statusRegex = /\/status (.+)/;
const removeRegex = /\/remove (.+)/;
const authorizedChats = ["-1001338634999", "-1001477240557", "-432339225", "565628827", "510597269"];

const startMessage = `
Welcome to another project of;
 |♦️[____ACHIYA____]♦️|
ACHI Drive LK - Official TorrDL Bot ⛑
Using this bot you can;
Search torrents (1337x, piratebay, limetorrents)
Download torrents into GDrive
And, get details of a torrent file.
||Commands||
Commands Relating to Torrenting and Downloading:
1.🕵🏻‍♂️🔗 /search {site} {query} - to Search for Torrents.
      eg. 
           /search 1337x Game of Thrones
           /search piratebay The 100 1080P
           /search limetorrents The Grand Tour S04
2.🔗🧲 /details {site} {magnet link} - Get Details of Torrent.
      eg. 
          /details 1337x https://1337x to/torrent/.....
3.📥🧲 /download {magnet link} - To start a download.
      eg. 
          /download magnet:?xt=urn:sge784y....
	  
4.📊🧲/status {magnet link} - To check status of a downloading torrent.
5.🗑  /remove {magnet link} - To remove an already added torrent.
6. To upload a file send the file to this bot it will be uploaded directly to drive
Commands Relating to Server and Bot Status:
1.📊 /server status - Get Current Storage, Status of Disk
2.⏳ /server uptime - Get Uptime of the Bot Server
Happy leeching!!
Owner & the Creator of this Bot - ♦️____ACHIYA____♦️
`;

const unauthorizedMessage = `
This is a Private Bot Which works only for Authorized Groups and will Not work in Personal Chat.
This Bot is Made Specifically for ACHI Drive LK Users.
I think You are not a Member of this ACHIDriveLK, So you don't deserve this Glory.🤞😛🥱
Join https://t.me/joinchat/AAAAAE_J8veLyqB9cqpK4g for Membership.
`;

function bot(torrent, bot) {
  bot.onText(/\/start/, async msg => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        bot.sendMessage(msg.chat.id, startMessage);
      } else {
        client.leave_chat(
	    chatId=msg.chat.id,
		deldete=True);
      }
  });

  bot.on("message", async msg => {	  
    if (!msg.document) return;
    const chatId = msg.chat.id;
    const mimeType = msg.document.mimeType;
    const fileName = msg.document.file_name;
    const fileId = msg.document.file_id;

    bot.sendMessage(chatId, "Uploading file....📤");
    try {
      const uploadedFile = await uploadFileStream(fileName, bot.getFileStream(fileId));
      const driveId = uploadedFile.data.id;
      const driveLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
      const publicLink = `${process.env.SITE}api/v1/drive/file/${fileName}?id=${driveId}`;
      bot.sendMessage(chatId, `${fileName} upload successful\nDrive link: ${driveLink}\nPublic link: ${publicLink}`);
    } catch (e) {
      bot.sendMessage(chatId, e.message || "An error occured😖");
   }
  });

  bot.onText(/\/server diskinfo (.+)/, async (msg, match) => {
    const from = msg.chat.id;
    const path = match[1];
    const info = await diskinfo(path);
    bot.sendMessage(from, info);
  });

  bot.onText(/\/server uptime/, async msg => {
    const from = msg.chat.id;
    bot.sendMessage(from, humanTime(process.uptime() * 1000));
  });

  bot.onText(/\/server status/, async msg => {
    const from = update.chat.id;
    const currStatus = await status();
    bot.sendMessage(from, currStatus);
  });

  bot.onText(searchRegex, async (msg, match) => {
    var from = msg.chat.id;
    var site = match[1];
    var query = match[2];

    bot.sendMessage(from, "Searching...🕵🏻‍♂️");

    const data = await axios(`${api}api/v1/search/${site}?query=${query}`).then(({ data }) => data);

    if (!data || data.error) {
      bot.sendMessage(from, "An error occured on server😖");
    } else if (!data.results || data.results.length === 0) {
      bot.sendMessage(from, "No results found.😐");
    } else if (data.results.length > 0) {
      let results1 = "";
      let results2 = "";
      let results3 = "";

      data.results.forEach((result, i) => {
        if (i <= 2) {
          results1 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        } else if (2 < i && i <= 5) {
          results2 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        } else if (5 < i && i <= 8) {
          results3 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
        }
      });

      bot.sendMessage(from, results1);
      bot.sendMessage(from, results2);
      bot.sendMessage(from, results3);
    }
  });

  bot.onText(detailsRegex, async (msg, match) => {
    var from = msg.chat.id;
    var site = match[1];
    var query = match[2];

    bot.sendMessage(from, "Loading...");

    const data = await axios(`${api}/details/${site}?query=${query}`).then(({ data }) => data);
    if (!data || data.error) {
      bot.sendMessage(from, "An error occured");
    } else if (data.torrent) {
      const torrent = data.torrent;
      let result1 = "";
      let result2 = "";

      result1 += `Title: ${torrent.title} \n\nInfo: ${torrent.info}`;
      torrent.details.forEach(item => {
        result2 += `${item.infoTitle} ${item.infoText} \n\n`;
      });
      result2 += "Magnet Link:";

      await bot.sendMessage(from, result1);
      await bot.sendMessage(from, result2);
      await bot.sendMessage(from, torrent.downloadLink);
    }
  });

  bot.onText(downloadRegex, (msg, match) => {
    var from = msg.chat.id;
    var link = match[1];
    let messageObj = null;
    let torrInterv = null;

    const reply = async torr => {
      let mess1 = "";
      mess1 += `♦️Name: ${torr.name}\n\n`;
      mess1 += `📊Status: ${torr.status}\n\n`;
      mess1 += `🗃Size: ${torr.total}\n\n`;
      if (!torr.done) {
        mess1 += `📥Downloaded: ${torr.downloaded}\n\n`;
        mess1 += `🏎Speed: ${torr.speed}\n\n`;
        mess1 += `📈Progress: ${torr.progress}%\n\n`;
        mess1 += `⏳Time Remaining: ${torr.redableTimeRemaining}\n\n`;
        mess1 += `♦️____ACHIYA____♦️ @ATVReqs\n\n`;

      } else {
        mess1 += `🔗Link: {torr.downloadLink}\n\n`;
        clearInterval(torrInterv);
        torrInterv = null;
      }
      mess1 += `🧲Magnet URI:`;
      try {
        if (messageObj) {
          if (messageObj.text !== mess1) bot.editMessageText(mess1, { chat_id: messageObj.chat.id, message_id: messageObj.message_id });
        } else messageObj = await bot.sendMessage(from, mess1);
      } catch (e) {
        console.log(e.message);
      }
    };

    const onDriveUpload = (torr, url) => bot.sendMessage(from, `${torr.name} uploaded to drive\n${url}`);
    const onDriveUploadStart = torr => bot.sendMessage(from, `Uploading ${torr.name} to gdrive`);

    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "Link is not a magnet link");
    } else {
      bot.sendMessage(from, "Starting download...");
      try {
        const torren = torrent.download(
          link,
          torr => reply(torr),
          torr => reply(torr),
          onDriveUpload,
          onDriveUploadStart
        );
        torrInterv = setInterval(() => reply(torrent.statusLoader(torren)), 5000);
      } catch (e) {
        bot.sendMessage(from, "An error occured\n" + e.message);
      }
    }
  });

  bot.onText(statusRegex, (msg, match) => {
    var from = msg.chat.id;
    var link = match[1];

    const torr = torrent.get(link);
    if (link.indexOf("magnet:") !== 0) {
      bot.sendMessage(from, "Link is not a magnet link");
    } else if (!torr) {
      bot.sendMessage(from, "Not downloading please add");
    } else {
      let mess1 = "";
      mess1 += `Name: ${torr.name}\n\n`;
      mess1 += `Status: ${torr.status}\n\n`;
      mess1 += `Size: ${torr.total}\n\n`;
      if (!torr.done) {
        mess1 += `Downloaded: ${torr.downloaded}\n\n`;
        mess1 += `Speed: ${torr.speed}\n\n`;
        mess1 += `Progress: ${torr.progress}\n\n`;
        mess1 += `Time Remaining: ${torr.redableTimeRemaining}\n\n`;
      } else {
        mess1 += `Link: ${torr.downloadLink}\n\n`;
      }
      mess1 += `Magnet URI: ${torr.magnetURI}`;
      bot.sendMessage(from, mess1);
    }
  });

  bot.onText(removeRegex, (msg, match) => {
    var from = msg.chat.id;
    var link = match[1];

    try {
      torrent.remove(link);
      bot.sendMessage(from, "Removed");
    } catch (e) {
      bot.sendMessage(from, `${e.message}`);
    }
  });
}

module.exports = bot;
