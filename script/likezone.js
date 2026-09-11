const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "likezone",
  version: "4.0.0",
  hasPermission: 0, // Set to 0 para siguradong gagana agad ang command handler
  credits: "sinzu",
  description: "Pure 👍 Thumbs Up Auto-Likezone Engine for PM (Persistent)",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/likezone on | off | status",
  cooldowns: 1
};

// Authorized Admin IDs
const ADMIN_IDS = [
  "61593900495161",
  "61594251452411",
  "61593919965251"
];

// Persistent File Data
const DATA_PATH = path.join(__dirname, "likezone_pure_data.json");
const PREFIXES = ["/", "!", ".", "?", "-", "$", "#"];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { active: false, activatedBy: null };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving likezone data:", err);
  }
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random Delay Helper (1.5s to 3s)
function getRandomDelay(min = 1500, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const lastResponseTime = new Map();

// ===== EVENT HANDLER (AUTO-LIKEZONE PM ENGINE) =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, isGroup } = event;

  // SYSTEM FILTERS:
  // 1. Huwag gagana kapag OFF ang engine
  // 2. Huwag gagana sa GC (PM ONLY)
  // 3. Huwag re-replyan ang sariling message ng bot
  if (!isActive() || isGroup === true || senderID === api.getCurrentUserID()) return;

  const cleanBody = (body || "").trim();
  const isSenderAdmin = ADMIN_IDS.includes(senderID.toString());
  const isCommand = PREFIXES.some((p) => cleanBody.startsWith(p));

  // Huwag pansinin kapag nagnag-command sa PM
  if (isSenderAdmin && isCommand) return;

  // Cooldown Protection per User
  const now = Date.now();
  const lastTime = lastResponseTime.get(senderID) || 0;
  const currentCooldown = getRandomDelay(1500, 3000);

  if (now - lastTime < currentCooldown) return;
  lastResponseTime.set(senderID, now);

  try {
    // 1. React 👍 sa PM ng nag-chat
    if (messageID) {
      api.setMessageReaction("👍", messageID, () => {}, true);
    }

    const humanDelay = getRandomDelay(1500, 3000);
    await sleep(humanDelay);

    // 2. Send 👍 Reply + Self React 👍 sa sariling message
    api.sendMessage("👍", threadID, (err, info) => {
      if (!err && info && info.messageID) {
        api.setMessageReaction("👍", info.messageID, () => {}, true);
      }
    }, messageID);

  } catch (error) {
    console.error("Likezone Engine Error:", error);
  }
};

// ===== COMMAND HANDLER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Flexible Admin ID Checker
  const isSenderAdmin = ADMIN_IDS.some(id => id.toString().trim() === senderID.toString().trim());

  if (!isSenderAdmin && event.permission < 2) {
    return api.sendMessage("⚠️ ADMIN ONLY: Walang kang permiso para gumamit ng command na ito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage("⚡ PURE LIKEZONE ENGINE: ACTIVATED ♾️\n📌 Lahat ng magcha-chat sa PM ay tanging 👍 lang ang ire-reply at ire-react 24/7.", threadID, messageID);
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("🛑 PURE LIKEZONE ENGINE: DEACTIVATED", threadID, messageID);
  }

  if (sub === "status") {
    return api.sendMessage(
      `📊 Pure Likezone Engine Status: ${data.active ? "ACTIVE ♾️ (Pure 👍 PM Mode)" : "INACTIVE"}\n` +
      `⏱️ Delay Speed: Dynamic (1.5s - 3s)\n` +
      `🎯 Output: 👍 Emoji Only + Dual React`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    "Likezone Commands:\n" +
    "/likezone on — Paandarin sa lahat ng PM\n" +
    "/likezone off — Patayin ang engine\n" +
    "/likezone status — Tingnan ang status",
    threadID,
    messageID
  );
};
