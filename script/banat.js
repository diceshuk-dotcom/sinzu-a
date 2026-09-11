const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sinzu",
  version: "20.0.0",
  hasPermission: 2, // Admin Only Permission
  credits: "sinzu",
  description: "Humanized High-Frequency OPS Engine with Self-React (Admin Only)",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/sinzu on | off | status | add <text> | listlines",
  cooldowns: 2
};

// Admin ID Configuration (Inupdate na ang listahan ng Admin IDs)
const ADMIN_IDS = [
  "61593900495161",
  "61594251452411",
  "61593919965251"
];

const DATA_PATH = path.join(__dirname, "sinzu_data.json");
const PREFIXES = ["/", "!", ".", "?", "-", "$", "#"];

// Toxic/War Reactions
const REACT_EMOJIS = ["💫", "💤", "🐝", "🤡", "⚡", "🗑️"];

// REVISED HF WAR LINES (NO FAMILY MENTIONS)
const DEFAULT_TAGALOG_ROASTS = [
  "lock na po daliri mong new gen ka quit ka na po",
  "mag dasal ka po baka siguro mawala pa ako",
  "dapat nag-aral ka na lang kesa nagpapaka hambog ka rito",
  "e kung pinag review at pinang aral mo time natin rito edi sana may natutunan ka pa, hindi yung bobo ka na mas naging bobo ka pa",
  "lsm bayan? basahin ko ba?",
  "mukhang hindi mo na kaya ha",
  "magkano kinikita mo sa pagiging tanga mo?",
  "magkano kinikita mo sa pagsusub ng unggoy sa zoo?",
  "ano feeling ng hindi napapagod katapat mo tapos ikaw hinihingal",
  "gamit ka immortality, rose gold, at ice crown baka sakali tumagal ka pa saken",
  "ayusin mo pagdadabog mo baka mabasag screen mo",
  "alam mo ba yung idol mo? hindi ako mapalagan sa lgc gusto lagi sa pm, takot mapahiya sa marami e"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      if (!parsed.roasts || parsed.roasts.length === 0) {
        parsed.roasts = DEFAULT_TAGALOG_ROASTS;
      }
      return parsed;
    }
  } catch {}
  return { active: false, activatedBy: null, roasts: DEFAULT_TAGALOG_ROASTS };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random delay helper para magmukhang totoong tao (Humanized Speed)
function getRandomDelay(min = 3000, max = 7000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// System para sa dynamic interval control per thread
const lastResponseTime = new Map();

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID } = event;

  // Huwag gumana kapag inactive ang engine o kapag sariling message ng bot
  if (!isActive() || senderID === api.getCurrentUserID()) return;

  const cleanBody = (body || "").trim();
  const isSenderAdmin = ADMIN_IDS.includes(senderID.toString());
  const isCommand = PREFIXES.some((p) => cleanBody.startsWith(p));

  // Huwag pansinin kapag admin command para hindi mag-reply habang nagko-command
  if (isSenderAdmin && isCommand) return;

  // HUMAN DURATION: Random Cooldown per thread (3 to 6 seconds guard)
  const now = Date.now();
  const lastTime = lastResponseTime.get(threadID) || 0;
  const currentCooldown = getRandomDelay(3000, 6000);

  if (now - lastTime < currentCooldown) return; 

  lastResponseTime.set(threadID, now);

  try {
    const data = loadData();
    const roastsList = data.roasts && data.roasts.length > 0 ? data.roasts : DEFAULT_TAGALOG_ROASTS;

    const randomRoast = roastsList[Math.floor(Math.random() * roastsList.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
    const selfEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    // 1. Instant emoji reaction sa message ng kalaban
    if (messageID) {
      api.setMessageReaction(randomEmoji, messageID, () => {}, true);
    }

    // HUMAN DURATION: Dynamic typing delay (3.5s to 6.5s delay bago mag-send)
    const humanDelay = getRandomDelay(3500, 6500);
    await sleep(humanDelay);

    // 2. Send HF Jargon Reply at mag-Self React sa sariling message
    api.sendMessage(randomRoast, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        // Self-react: Nilalagyan ng reaction ang sariling ipinadalang message
        api.setMessageReaction(selfEmoji, info.messageID, () => {}, true);
      }
    }, messageID);

  } catch (error) {
    console.error("Sinzu HF Engine Error:", error);
  }
};

// ===== COMMAND HANDLER (ADMIN ONLY) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(senderID.toString())) {
    return api.sendMessage("⚠️ ADMIN ONLY: Walang kang permiso para gumamit ng command na ito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage("⚡ Sinzu HF OPS Engine: ACTIVATED (Humanized Dynamic Delay | Self-React Enabled)", threadID, messageID);
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("🛑 Sinzu HF OPS Engine: DEACTIVATED", threadID, messageID);
  }

  if (sub === "status") {
    return api.sendMessage(
      `📊 Engine Status: ${data.active ? "ACTIVE ♾️" : "INACTIVE"}\n` +
      `⏱️ Delay Mode: Humanized Dynamic (3s - 7s)\n` +
      `🎯 Features: Dual React (Opponent & Self-React)\n` +
      `📜 Total Lines: ${(data.roasts || DEFAULT_TAGALOG_ROASTS).length}`,
      threadID,
      messageID
    );
  }

  if (sub === "add") {
    const customLine = args.slice(1).join(" ");
    if (!customLine) {
      return api.sendMessage("❌ Paki-lagay ang HF jargon line na idadagdag.", threadID, messageID);
    }

    if (!data.roasts) data.roasts = DEFAULT_TAGALOG_ROASTS;
    data.roasts.push(customLine);
    saveData(data);

    return api.sendMessage(`✅ Naidagdag sa HF lines:\n"${customLine}"`, threadID, messageID);
  }

  if (sub === "listlines") {
    const list = data.roasts || DEFAULT_TAGALOG_ROASTS;
    let msg = `📜 HF Jargon Lines (${list.length}):\n\n`;
    list.forEach((line, index) => {
      msg += `${index + 1}. ${line}\n`;
    });
    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage(
    "Sinzu Admin Commands:\n" +
    "/sinzu on — Paandarin ang HF engine\n" +
    "/sinzu off — Patayin ang HF engine\n" +
    "/sinzu status — Tingnan ang status\n" +
    "/sinzu add <text> — Magdagdag ng HF line\n" +
    "/sinzu listlines — Tingnan ang mga naka-save na lines",
    threadID,
    messageID
  );
};
