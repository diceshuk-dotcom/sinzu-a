const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "help",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Sinzu",
  description: "Automatic command list — detects old and new commands.",
  commandCategory: "general",
  usages: "[command name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  // ==========================================
  // AUTO DETECT COMMANDS
  // ==========================================

  const commandFolder = path.join(__dirname);

  let commandList = [];

  try {
    const files = fs.readdirSync(commandFolder);

    for (const file of files) {
      // JS files lang
      if (!file.endsWith(".js")) continue;

      // Huwag isama ang sarili
      if (file === "help.js") continue;

      try {
        const commandPath = path.join(commandFolder, file);
        const command = require(commandPath);

        // Kukunin ang command name sa config
        if (
          command &&
          command.config &&
          command.config.name
        ) {
          commandList.push({
            name: command.config.name.toLowerCase(),
            description: command.config.description || "No description",
            category: command.config.commandCategory || "general",
            permission: command.config.hasPermission ?? 0
          });
        }

      } catch (err) {
        // Skip lang kapag may sirang command
        console.log(`[HELP] Failed to load: ${file}`);
      }
    }

  } catch (err) {
    console.error("[HELP] Failed to read command folder:", err);

    return api.sendMessage(
      "❌ Hindi ma-load ang command folder.",
      event.threadID,
      event.messageID
    );
  }

  // ==========================================
  // REMOVE DUPLICATES + SORT
  // ==========================================

  const unique = new Map();

  for (const cmd of commandList) {
    if (!unique.has(cmd.name)) {
      unique.set(cmd.name, cmd);
    }
  }

  commandList = Array.from(unique.values());

  commandList.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // ==========================================
  // PREFIX
  // ==========================================

  const prefix =
    global.config?.PREFIX ||
    global.config?.prefix ||
    "/";

  // ==========================================
  // SPECIFIC COMMAND
  // ==========================================

  if (args[0]) {

    const cmdName = args[0].toLowerCase();

    const command = commandList.find(
      cmd => cmd.name === cmdName
    );

    if (!command) {
      return api.sendMessage(
        `❌ Walang command na "${cmdName}".\n\n` +
        `Type "${prefix}help" para makita lahat ng commands.`,
        event.threadID,
        event.messageID
      );
    }

    let permissionText = "Everyone";

    if (command.permission === 1) {
      permissionText = "Group Admin";
    } else if (command.permission >= 2) {
      permissionText = "Bot Admin";
    }

    return api.sendMessage(
      `╭─────────────────╮\n` +
      `   📌 COMMAND INFO\n` +
      `╰─────────────────╯\n\n` +

      `Name: ${command.name}\n` +
      `Usage: ${prefix}${command.name}\n` +
      `Category: ${command.category}\n` +
      `Permission: ${permissionText}\n` +
      `Description: ${command.description}\n\n` +

      `━━━━━━━━━━━━━━━━\n` +
      `Type "${prefix}help" para sa lahat ng commands.`,
      event.threadID,
      event.messageID
    );
  }

  // ==========================================
  // GROUP COMMANDS BY CATEGORY
  // ==========================================

  const categories = {};

  for (const cmd of commandList) {

    const category =
      cmd.category.toLowerCase();

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push(cmd);
  }

  // ==========================================
  // BUILD HELP MENU
  // ==========================================

  let msg =
    `╭────────────────────────╮\n` +
    `     📖 SINZU BOT — HELP\n` +
    `╰────────────────────────╯\n\n`;

  msg += `👑 Owner: Sinzu\n`;
  msg += `📦 Total Commands: ${commandList.length}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;

  for (const category of Object.keys(categories).sort()) {

    msg += `\n【 ${category.toUpperCase()} 】\n`;

    for (const cmd of categories[category]) {
      msg += `${prefix}${cmd.name}\n`;
    }
  }

  msg +=
    `\n━━━━━━━━━━━━━━━━━━━━\n\n` +
    `💡 Use:\n` +
    `${prefix}help [command]\n\n` +
    `Example:\n` +
    `${prefix}help ai`;

  return api.sendMessage(
    msg,
    event.threadID,
    event.messageID
  );
};
