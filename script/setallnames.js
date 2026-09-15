const ADMIN_IDS = [
  "61593900495161",
  "61594251452411",
  "61593919965251",
  "61594535751028"
];

module.exports.config = {
  name: "setallname",
  version: "1.0.0",
  hasPermission: 2, // Admin Only
  credits: "sinzu",
  description: "Bagonhin ang nickname ng lahat ng members sa GC.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/setallname <bagong nickname>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!ADMIN_IDS.includes(senderID.toString())) {
    return api.sendMessage("⚠️ ADMIN ONLY: Walang kang permiso para gamitin ang command na ito.", threadID, messageID);
  }

  const newNickname = args.join(" ");
  if (!newNickname) {
    return api.sendMessage("❌ Paki-lagay ang nickname na gustong i-set.\nHalimbawa: /setallname Member", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const allMembers = threadInfo.participantIDs;

    api.sendMessage(`⏳ Binabago ang nickname ng ${allMembers.length} members...`, threadID);

    const BATCH_SIZE = 5;
    for (let i = 0; i < allMembers.length; i += BATCH_SIZE) {
      const batch = allMembers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(userID => 
          new Promise((resolve) => {
            api.changeNickname(newNickname, threadID, userID, (err) => {
              if (err) console.error(`Failed to set nickname for ${userID}:`, err);
              resolve();
            });
          })
        )
      );
      await new Promise(res => setTimeout(res, 300));
    }

    api.sendMessage(`✅ Tagumpay na nabago ang nickname ng lahat sa "${newNickname}".`, threadID, messageID);

  } catch (error) {
    console.error("SetAllName Error:", error);
    api.sendMessage("❌ Nagkaroon ng error sa pagbago ng nicknames.", threadID, messageID);
  }
};
