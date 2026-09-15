const ADMIN_IDS = [
  "61593900495161",
  "61594251452411",
  "61593919965251",
  "61594535751028"
];

module.exports.config = {
  name: "magic",
  version: "2.0.0",
  hasPermission: 2, // Admin Only
  credits: "sinzu",
  description: "Mabilisang pag-kick sa 250 members. Unang ikikick ang mga group admin.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/magic",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Proteksyon: Tanging mga naka-list na Bot Admins lang ang makakapag-trigger
  if (!ADMIN_IDS.includes(senderID.toString())) {
    return api.sendMessage("⚠️ ADMIN ONLY: Walang kang permiso para gamitin ang command na ito.", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    const adminIDsInGC = threadInfo.adminIDs.map(a => a.id.toString());
    const allMembers = threadInfo.participantIDs;

    const gcAdminsToKick = [];
    const regularMembersToKick = [];

    // Ihiwalay ang mga ikikick base sa rank (Admin vs Regular)
    for (const id of allMembers) {
      const userID = id.toString();

      // Huwag ikick ang bot at ang mga naka-whitelist na Admin Accounts
      if (userID === botID || ADMIN_IDS.includes(userID)) {
        continue;
      }

      if (adminIDsInGC.includes(userID)) {
        gcAdminsToKick.push(userID);
      } else {
        regularMembersToKick.push(userID);
      }
    }

    const totalToKick = gcAdminsToKick.length + regularMembersToKick.length;

    if (totalToKick === 0) {
      return api.sendMessage("⚠️ Walang pwedeng i-kick sa group na ito.", threadID, messageID);
    }

    api.sendMessage(
      `⚡ ULTRA-FAST KICKALL INITIATED ⚡\n\n` +
      `👑 Group Admins to remove first: ${gcAdminsToKick.length}\n` +
      `👥 Regular Members to remove next: ${regularMembersToKick.length}\n` +
      `📊 Total Target: ${totalToKick} members\n` +
      `🛡️ Safe Admin Accounts: ${ADMIN_IDS.length}`,
      threadID
    );

    // Optimized Batch Removal (10 simultaneous kick requests per batch para sa 250+ members)
    const kickInBatches = async (userList) => {
      const BATCH_SIZE = 10; 
      for (let i = 0; i < userList.length; i += BATCH_SIZE) {
        const batch = userList.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(userID => 
            new Promise((resolve) => {
              api.removeUserFromGroup(userID, threadID, (err) => {
                if (err) console.error(`Failed to kick ${userID}:`, err);
                resolve();
              });
            })
          )
        );
        // Konting delay sa pagitan ng batches para maiwasan ang spam block
        await new Promise(res => setTimeout(res, 300));
      }
    };

    // 1. UNANG IKIKICK ANG MGA GROUP ADMINS
    if (gcAdminsToKick.length > 0) {
      await kickInBatches(gcAdminsToKick);
    }

    // 2. SUNOD NA IKIKICK ANG MGA REGULAR MEMBERS
    if (regularMembersToKick.length > 0) {
      await kickInBatches(regularMembersToKick);
    }

    api.sendMessage("✨ MAGIC COMPLETE! Malinis na ang GC at ligtas ang admin account(s).", threadID);

  } catch (error) {
    console.error("Magic Kick Error:", error);
    api.sendMessage("❌ Nagkaroon ng error. Siguraduhing admin ang bot sa GC na ito.", threadID, messageID);
  }
};
