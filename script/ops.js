const adminID = "61593919965251"; 
let spamIntervals = {};

module.exports.config = {
  name: "ops",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "bot",
  description: "Continuous spam command",
  commandCategory: "utility",
  usages: "[threadID]",
  cooldowns: 1
};

module.exports.run = async function({ api, event, args }) {
  const senderID = event.senderID;

  // I-verify kung ang nag-command ay ang Admin ID
  if (senderID !== adminID) {
    return api.sendMessage("Unauthorized: Admin lang ang pwedeng gumamit nito.", event.threadID, event.messageID);
  }

  const targetThreadID = args[0] || event.threadID;

  // Command para ihinto ang spam (/ops stop [threadID])
  if (args[0] === "stop") {
    const stopTarget = args[1] || event.threadID;
    if (spamIntervals[stopTarget]) {
      clearInterval(spamIntervals[stopTarget]);
      delete spamIntervals[stopTarget];
      return api.sendMessage(`Inihinto ang spam sa Thread ID: ${stopTarget}`, event.threadID);
    } else {
      return api.sendMessage(`Walang aktibong spam sa Thread ID: ${stopTarget}`, event.threadID);
    }
  }

  // Tiyakin na walang nagpapatakbong spam sa parehong target
  if (spamIntervals[targetThreadID]) {
    return api.sendMessage(`May umiiral nang spam sa Thread ID: ${targetThreadID}`, event.threadID);
  }

  api.sendMessage(`Nagsimula na ang spam bawat 5 segundo sa Thread ID: ${targetThreadID}`, event.threadID);

  // Simulan ang walang hinto (no time limit) na spam bawat 5 segundo (5000ms)
  spamIntervals[targetThreadID] = setInterval(() => {
    const message = `/ops ${targetThreadID}`;

    api.sendMessage(message, targetThreadID, (err) => {
      if (err) {
        console.error(`Pumalya ang pagpapadala sa ${targetThreadID}:`, err);
      }
    });
  }, 5000);
};
