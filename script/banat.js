const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sinzu",
  version: "18.0.0",
  hasPermission: 2, // Admin Only Permission
  credits: "sinzu",
  description: "Pure OPS Reply Engine (Admin Only) - 5 Seconds Auto-Lapag (PM & GC/LGC)",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/sinzu on | off | status | add <text> | listlines",
  cooldowns: 2
};

// Admin ID Configuration (Sila lang ang pwedeng gumamit ng command)
const ADMIN_IDS = [
  "61593900495161",
  "61594251452411"
];

const DATA_PATH = path.join(__dirname, "sinzu_data.json");
const PREFIXES = ["/", "!", ".", "?", "-", "$", "#"];

// Requested Emojis
const REACT_EMOJIS = ["💫", "💤", "🐝"];

// Pure OPS Reply Lines LANG
const DEFAULT_TAGALOG_ROASTS = [
  "opsie",
  "ops"
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

// System para sa 5-second interval control per thread
const lastResponseTime = new Map();

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID } = event;

  // Huwag gumana kapag inactive ang engine o kapag sariling message ng bot
  if (!isActive() || senderID === api.getCurrentUserID()) return;

  const cleanBody = (body || "").trim();
  const isSenderAdmin = ADMIN_IDS.includes(senderID.toString());
  const isCommand = PREFIXES.some((p) => cleanBody.startsWith(p));

  // Huwag pansinin kapag admin command para hindi mag-reply ang ops engine habang nagko-command ang admin
  if (isSenderAdmin && isCommand) return;

  // 5 SECONDS SPEED CONTROL PER CHAT THREAD (PM, GC, LGC)
  const now = Date.now();
  const lastTime = lastResponseTime.get(threadID) || 0;
  if (now - lastTime < 5000) return; 

  lastResponseTime.set(threadID, now);

  try {
    const data = loadData();
    const roastsList = data.roasts && data.roasts.length > 0 ? data.roasts : DEFAULT_TAGALOG_ROASTS;

    // Random selection para "ops" o "opsie" LANG talaga ang lalabas
    const randomRoast = roastsList[Math.floor(Math.random() * roastsList.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    // Instant emoji reaction
    if (messageID) {
      api.setMessageReaction(randomEmoji, messageID, () => {}, true);
    }

    // 5-second interval delay bago ang lapag
    await sleep(5000);

    // Pure OPS text LANG ang ire-reply (walang mentions/tags para malinis)
    api.sendMessage(randomRoast, threadID, messageID);

  } catch (error) {
    console.error("Sinzu OPS Engine Error:", error);
  }
};

// ===== COMMAND HANDLER (ADMIN ONLY) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Security Check: Pag hindi admin ID, dededmahin o magre-reject
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

    return api.sendMessage("⚡ Sinzu OPS Engine: ACTIVATED (Pure OPS Lines Only | PM & GC/LGC)", threadID, messageID);
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("🛑 Sinzu OPS Engine: DEACTIVATED", threadID, messageID);
  }

  if (sub === "status") {
    return api.sendMessage(
      `📊 Engine Status: ${data.active ? "ACTIVE ♾️" : "INACTIVE"}\n` +
      `⏱️ Speed: 5 Seconds per Reply\n` +
      `🎯 Mode: Pure OPS ("ops" / "opsie")\n` +
      `📜 Total Lines: ${(data.roasts || DEFAULT_TAGALOG_ROASTS).length}`,
      threadID,
      messageID
    );
  }

  if (sub === "add") {
    const customLine = args.slice(1).join(" ");
    if (!customLine) {
      return api.sendMessage("❌ Paki-lagay ang ops line na idadagdag.", threadID, messageID);
    }

    if (!data.roasts) data.roasts = DEFAULT_TAGALOG_ROASTS;
    data.roasts.push(customLine);
    saveData(data);

    return api.sendMessage(`✅ Naidagdag sa OPS lines:\n"${customLine}"`, threadID, messageID);
  }

  if (sub === "listlines") {
    const list = data.roasts || DEFAULT_TAGALOG_ROASTS;
    let msg = `📜 OPS Lines (${list.length}):\n\n`;
    list.forEach((line, index) => {
      msg += `${index + 1}. ${line}\n`;
    });
    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage(
    "Sinzu Admin Commands:\n" +
    "/sinzu on — Paandarin ang OPS engine\n" +
    "/sinzu off — Patayin ang OPS engine\n" +
    "/sinzu status — Tingnan ang status\n" +
    "/sinzu add <text> — Magdagdag ng ops line\n" +
    "/sinzu listlines — Tingnan ang mga naka-save na lines",
    threadID,
    messageID
  );
};
