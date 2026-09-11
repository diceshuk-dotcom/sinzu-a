const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "11.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Auto-reply engine set to 5-second interval per reply with Anti-Bot Ban, Anti-Silent protection, custom reactions (💫, 💤, 🐝), and unlimited duration.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/activate on | off | status | add <text> | listlines",
  cooldowns: 2
};

// Admin ID Configuration
const ADMIN_IDS = [
  "61593900495161",
  "61594251452411"
];

const DATA_PATH = path.join(__dirname, "activate_data.json");
const PREFIXES = ["/", "!", ".", "?", "-", "$", "#"];

// Requested Emojis
const REACT_EMOJIS = ["💫", "💤", "🐝"];

// Ang iyong mga eksaktong linya
const DEFAULT_TAGALOG_ROASTS = [
  "Immuned ako sa puyat ahahahahaha mahirap ako mapaales",
  "kulang ka pa saken boboka mag tawag ka pa",
  "wag ako palagan mo tanga no time limit ako",
  "dapat wala ka social life pag ako katapat mo",
  "hindi mo ako mapapatatalo ket mag droga ka",
  "pzt penge ako thrill HAHAHAHAHA"
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

// System para sa 5-second delay control per thread
const lastResponseTime = new Map();

// ===== ANTI-BOT AUTO-BAN DETECTOR =====
function isOtherBot(event) {
  if (event.isGroup === false) return false;
  
  const botPrefixes = ["/", "!", ".", "?", "-", "$", "#", "!cmd", "/cmd"];
  const hasPrefix = botPrefixes.some(p => event.body && event.body.startsWith(p));
  const isAutomatedMessage = event.isUnread === false || (event.type === "message_reply" && event.messageReply?.senderID === event.senderID);

  return hasPrefix || isAutomatedMessage;
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID } = event;

  if (!isActive() || senderID === api.getCurrentUserID()) return;

  const cleanBody = (body || "").trim();
  const isSenderAdmin = ADMIN_IDS.includes(senderID.toString());
  const isCommand = PREFIXES.some((p) => cleanBody.startsWith(p));

  // Wag pansinin kapag admin command
  if (isSenderAdmin && isCommand) return;

  // ===== FEATURE: AUTO-BAN/BLOCK IBANG BOT =====
  if (!isSenderAdmin && isOtherBot(event)) {
    try {
      if (api.changeBlockedStatus) {
        api.changeBlockedStatus(senderID, true);
      }
      
      api.removeUserFromGroup(senderID, threadID, (err) => {
        if (!err) {
          api.sendMessage(`🚫 AUTO-BAN: Ang bot account (${senderID}) ay na-detect at na-kick/block sa system.`, threadID);
        }
      });
      return;
    } catch (e) {
      console.error("Auto-ban trigger error:", e);
    }
  }

  // 5 SECONDS DELAY CONTROL
  const now = Date.now();
  const lastTime = lastResponseTime.get(threadID) || 0;
  if (now - lastTime < 5000) return; // Lilipas muna ang 5 seconds bago mag-reply ulit

  lastResponseTime.set(threadID, now);

  try {
    const data = loadData();
    const roastsList = data.roasts && data.roasts.length > 0 ? data.roasts : DEFAULT_TAGALOG_ROASTS;

    const randomRoast = roastsList[Math.floor(Math.random() * roastsList.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    // Instant reaction
    if (messageID) {
      api.setMessageReaction(randomEmoji, messageID, () => {}, true);
    }

    // Await 5 seconds interval delay
    await sleep(5000);

    api.sendMessage({
      body: randomRoast,
      mentions: [{ tag: `@${senderID}`, id: senderID }]
    }, threadID, messageID);

  } catch (error) {
    console.error("Engine execution error:", error);
  }
};

// ===== COMMAND HANDLER (ADMIN ONLY) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(senderID.toString())) return;

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage("⚡ Auto-Reply Engine: ACTIVATED (5 Seconds Speed | Unlimited Duration | Anti-Bot Ban)", threadID, messageID);
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("🛑 Auto-Reply Engine: DEACTIVATED", threadID, messageID);
  }

  if (sub === "status") {
    return api.sendMessage(
      `📊 Engine Status: ${data.active ? "ACTIVE ♾️" : "INACTIVE"}\n` +
      `⏱️ Interval Speed: 5 Seconds per Reply\n` +
      `🛡️ Anti-Bot Feature: AUTO-BLOCK & KICK ENABLED\n` +
      `🔥 Auto Reactions: 💫 💤 🐝\n` +
      `📜 Loaded Lines: ${(data.roasts || DEFAULT_TAGALOG_ROASTS).length}`,
      threadID,
      messageID
    );
  }

  if (sub === "add") {
    const customLine = args.slice(1).join(" ");
    if (!customLine) {
      return api.sendMessage("❌ Paki-lagay ang linyang gusto mong idagdag.", threadID, messageID);
    }

    if (!data.roasts) data.roasts = DEFAULT_TAGALOG_ROASTS;
    data.roasts.push(customLine);
    saveData(data);

    return api.sendMessage(`✅ Tagumpay na naidagdag:\n"${customLine}"`, threadID, messageID);
  }

  if (sub === "listlines") {
    const list = data.roasts || DEFAULT_TAGALOG_ROASTS;
    let msg = `📜 Custom Reply Lines (${list.length}):\n\n`;
    list.forEach((line, index) => {
      msg += `${index + 1}. ${line}\n`;
    });
    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage(
    "Mga Command:\n" +
    "/activate on — Paandarin ang engine\n" +
    "/activate off — Patayin ang engine\n" +
    "/activate status — Tingnan ang lagay ng engine\n" +
    "/activate add <text> — Magdagdag ng bagong reply line\n" +
    "/activate listlines — Ipakita ang lahat ng naka-save na lines",
    threadID,
    messageID
  );
};
