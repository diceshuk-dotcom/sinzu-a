module.exports.config = {
  name: "help",
  version: "1.0.1",
  hasPermission: 0,
  credits: "Sinzu",
  description: "Ipinapakita ang lahat ng available commands.",
  commandCategory: "general",
  usages: "[command name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { commands } = global.client;
  const prefix = global.config?.PREFIX || "/";

  // Kung may binigay na specific na command name (hal. /help ai)
  if (args[0]) {
    const cmdName = args[0].toLowerCase();
    const command = commands.get(cmdName) || commands.get(global.plugins.aliases.get(cmdName));

    if (!command) {
      return api.sendMessage(`❌ Walang command na "${cmdName}".`, event.threadID, event.messageID);
    }

    const { config } = command;
    let detailMsg = `📌 COMMAND DETAILS\n━━━━━━━━━━━━━━━━\n`;
    detailMsg += `🔹 Pangalan: ${config.name}\n`;
    detailMsg += `🔹 Kategorya: ${config.commandCategory || "N/A"}\n`;
    detailMsg += `🔹 Paggamit: ${prefix}${config.name} ${config.usages || ""}\n`;
    detailMsg += `🔹 Cooldown: ${config.cooldowns || 5} segundo/s\n`;
    detailMsg += `🔹 Deskripsyon: ${config.description || "Walang deskripsyon."}`;

    return api.sendMessage(detailMsg, event.threadID, event.messageID);
  }

  // Kukunin nang awtomatiko ang lahat ng pangalan ng commands at io-order alphabetically
  const commandNames = Array.from(commands.keys()).sort();

  let msg = `╭─────────────────╮\n`;
  msg += `   📖 SINZU BOT — HELP MENU\n`;
  msg += `╰─────────────────╯\n\n`;
  msg += `👑 Owner: Sinzu\n`;
  msg += `📦 Total Commands: ${commandNames.length}\n\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;

  commandNames.forEach((cmd, i) => {
    msg += `${i + 1}. ${prefix}${cmd}\n`;
  });

  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `\nType "${prefix}help [command]" para sa detalye ng specific na command.`;

  return api.sendMessage(msg, event.threadID, event.messageID);
};
