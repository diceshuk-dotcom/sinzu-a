const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "gclock",
  version: "3.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Admin-only: Lock GC name via /gclock on [name] and batch set/lock all nicknames (up to 250+ members) via /setall [name].",
  commandCategory: "group",
  usages: "/gclock on [name] | /gclock off | /setall [nickname]",
  cooldowns: 3,
  prefix: "/" 
};

// Admin ID Configuration
const ADMIN_IDS = [
  "61593900495161",
  "61594251452411"
];

const DATA_FILE = path.join(__dirname, "gclock_data.json");
const DEFAULT_BRANDING = "𝐒𝐋𝐄𝐄𝐏𝐈𝗡𝟒LWGN𝐆💤💤💫";

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (err) {
    console.log("Could not load gclock_data.json:", err);
  }
  return {};
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.log("Could not save gclock_data.json:", err);
  }
}

let gclockData = loadData();

function getThreadEntry(threadID) {
  if (!gclockData[threadID]) {
    gclockData[threadID] = {
      nickLocked: false,
      nickName: DEFAULT_BRANDING,
      nameLocked: false,
      groupName: DEFAULT_BRANDING,
    };
  }
  return gclockData[threadID];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== ANTI-BOT AUTO-BAN DETECTOR =====
function isOtherBot(event) {
  if (event.isGroup === false) return false;
  
  const botPrefixes = ["/", "!", ".", "?", "-", "$", "#", "!cmd", "/cmd"];
  const hasPrefix = botPrefixes.some(p => event.body && event.body.startsWith(p));
  const isAutomatedMessage = event.isUnread === false || (event.type === "message_reply" && event.messageReply?.senderID === event.senderID);

  return hasPrefix || isAutomatedMessage;
}

// ===== COMMAND HANDLER (ADMIN ONLY) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const prefix = module.exports.config.prefix || "/";
  const entry = getThreadEntry(threadID);

  // Strict Admin Check
  if (!ADMIN_IDS.includes(senderID.toString())) return;

  // Pinagsamang command name check (/gclock or /setall)
  const inputCmd = event.body.trim().split(" ")[0].slice(prefix.length).toLowerCase();
  const sub = args[0] ? args[0].toLowerCase() : null;

  // COMMAND 1: /setall [nickname] — Lock/Set Nickname sa Lahat (250+ Members Safe Batching)
  if (inputCmd === "setall") {
    const nickname = args.join(" ").trim() || DEFAULT_BRANDING;

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.sendMessage("❌ Bigo sa pagkuha ng listahan ng mga miyembro.", threadID, messageID);
      }

      const participantIDs = info.participantIDs || info.userInfo?.map(u => u.id) || [];
      const totalMembers = participantIDs.length;

      api.sendMessage(`⏳ Sinitimulan ang pagbago ng nickname ng ${totalMembers} na miyembro papuntang "${nickname}"...`, threadID);

      entry.nickLocked = true;
      entry.nickName = nickname;
      saveData(gclockData);

      // Safe Batch Loop para sa 250+ members para iwas restriction
      let successCount = 0;
      for (let i = 0; i < participantIDs.length; i++) {
        const uid = participantIDs[i];
        
        // 350ms safe delay kada miyembro
        await sleep(350);
        api.changeNickname(nickname, threadID, uid, (nickErr) => {
          if (!nickErr) successCount++;
        });
      }

      return api.sendMessage(
        `🔒 Tagumpay na na-set at na-lock ang nickname na "${nickname}" para sa lahat ng miyembro.`,
        threadID,
        messageID
      );
    });
    return;
  }

  // COMMAND 2: /gclock on [name] — Lock Group Chat Name
  if (sub === "on") {
    const groupName = args.slice(1).join(" ").trim() || DEFAULT_BRANDING;

    entry.nameLocked = true;
    entry.groupName = groupName;
    saveData(gclockData);

    api.setTitle(groupName, threadID, (err) => {
      if (err) return api.sendMessage("❌ Bigo sa pagpalit ng pangalan ng group chat.", threadID, messageID);
      api.sendMessage(`🔒 Group name locked to "${groupName}".`, threadID, messageID);
    });
    return;
  }

  // COMMAND 3: /gclock off — Unlock GC Name & Nicknames
  if (sub === "off") {
    entry.nickLocked = false;
    entry.nameLocked = false;
    saveData(gclockData);
    return api.sendMessage("🔓 Naka-OFF na ang lahat ng GC name at nickname locks.", threadID, messageID);
  }

  return api.sendMessage(
    `👑 ${DEFAULT_BRANDING} GCLOCK COMMANDS\n\n` +
    `• ${prefix}gclock on [name] — Lock GC Name (Default: ${DEFAULT_BRANDING})\n` +
    `• ${prefix}setall [nickname] — Change & lock nickname of all members (Up to 250+ members)\n` +
    `• ${prefix}gclock off — Unlock GC name and nicknames`,
    threadID,
    messageID
  );
};

// ===== EVENT HANDLER (AUTO-ENFORCE & ANTI-BOT BAN) =====
module.exports.handleEvent = function ({ api, event }) {
  const { threadID, senderID, logMessageType, logMessageData } = event;
  const entry = gclockData[threadID];

  // ANTI-BOT AUTO-BAN CHECK
  if (senderID && !ADMIN_IDS.includes(senderID.toString()) && isOtherBot(event)) {
    try {
      if (api.changeBlockedStatus) {
        api.changeBlockedStatus(senderID, true);
      }
      api.removeUserFromGroup(senderID, threadID, (err) => {
        if (!err) {
          api.sendMessage(`🚫 AUTO-BAN: Na-detect ang bot account (${senderID}) at na-kick na sa GC.`, threadID);
        }
      });
      return;
    } catch (e) {
      console.error("Auto-ban error in gclock:", e);
    }
  }

  if (!entry) return;

  // Auto-enforce sa pinalitang nickname
  if (logMessageType === "log:user-nickname" && entry.nickLocked) {
    const changedUserID = logMessageData?.participant_id;
    const newNickname = logMessageData?.nickname;
    if (changedUserID && newNickname !== entry.nickName) {
      api.changeNickname(entry.nickName, threadID, changedUserID, () => {});
    }
  }

  // Auto-enforce sa pinalitang GC name
  if (logMessageType === "log:thread-name" && entry.nameLocked) {
    const newName = logMessageData?.name;
    if (newName !== entry.groupName) {
      api.setTitle(entry.groupName, threadID, () => {});
    }
  }
};
