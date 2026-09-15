const ADMIN_IDS = [
  "61593900495161",
  "61594251452411",
  "61593919965251",
  "61594535751028"
];

module.exports.config = {
  name: "clearallname",
  version: "1.0.0",
  hasPermission: 2, // Admin Only
  credits: "sinzu",
  description: "Alisin ang nickname ng lahat ng members sa GC para bumalik sa tunay na pangalan.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/clearallname",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(senderID.toString())) {
    return api.sendMessage("⚠️ ADMIN ONLY: Walang kang permiso para gamitin ang command na ito.", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const allMembers = threadInfo.participantIDs;

    api.sendMessage(`⏳ Tinatanggal ang nicknames ng ${allMembers.length} members...`, threadID);

    const BATCH_SIZE = 5;
    for (let i = 0; i < allMembers.length; i += BATCH_SIZE) {
      const batch = allMembers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(userID => 
          new Promise((resolve) => {
            // Ang pag-pass ng empty string ("") ay nagtatanggal ng nickname
            api.changeNickname("", threadID, userID, (err) => {
              if (err) console.error(`Failed to clear nickname for ${userID}:`, err);
              resolve();
            });
          })
        )
      );
      await new Promise(res => setTimeout(res, 300));
    }

    api.sendMessage("✅ Tagumpay na natanggal ang lahat ng nickname sa GC.", threadID, messageID);

  } catch (error) {
    console.error("ClearAllName Error:", error);
    api.sendMessage("❌ Nagkaroon ng error sa pag-clear ng nicknames.", threadID, messageID);
  }
};
