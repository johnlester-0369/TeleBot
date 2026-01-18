/**
 * TeleBot - Modular Telegram Bot
 * Main entry point - loads all modules and initializes bot
 */

import "dotenv/config";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate BOT_TOKEN
if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Storage for loaded modules
const loadedCommands = [];
const loadedEvents = [];

/**
 * Checks if the current chat is a group or supergroup
 * @param {object} ctx - Telegraf context object
 * @returns {boolean} True if chat is a group or supergroup
 */
function isGroupChat(ctx) {
  const chatType = ctx.chat?.type;
  return chatType === "group" || chatType === "supergroup";
}

/**
 * Extracts the command argument text from message
 * @param {object} ctx - Telegraf context object
 * @returns {string} The text after the command, trimmed
 */
function getCommandArgs(ctx) {
  const text = ctx.message?.text || "";
  const match = text.match(/^\/\w+(?:@\w+)?\s*(.*)/);
  return match ? match[1].trim() : "";
}

/**
 * Returns all loaded command configs for /help command
 * @returns {Array<{name: string, description: string, permission: string}>}
 */
function getCommands() {
  return loadedCommands.map((cmd) => ({
    name: cmd.config.name,
    description: cmd.config.description,
    permission: cmd.config.permission,
  }));
}

/**
 * Loads all command modules from modules/commands directory
 */
async function loadCommands() {
  const commandsPath = join(__dirname, "modules", "commands");

  try {
    const files = await readdir(commandsPath);
    const jsFiles = files.filter((file) => file.endsWith(".js"));

    for (const file of jsFiles) {
      try {
        const modulePath = join(commandsPath, file);
        const commandModule = await import(`file://${modulePath}`);

        if (!commandModule.config || !commandModule.config.name) {
          console.warn(`Skipping ${file}: missing config or config.name`);
          continue;
        }

        const { config, onStart, onChat } = commandModule;

        loadedCommands.push({
          config,
          onStart,
          onChat,
          file,
        });

        console.log(`Loaded command: ${config.name} (${file})`);
      } catch (error) {
        console.error(`Failed to load command ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Failed to read commands directory:", error.message);
  }
}

/**
 * Loads all event modules from modules/events directory
 */
async function loadEvents() {
  const eventsPath = join(__dirname, "modules", "events");

  try {
    const files = await readdir(eventsPath);
    const jsFiles = files.filter((file) => file.endsWith(".js"));

    for (const file of jsFiles) {
      try {
        const modulePath = join(eventsPath, file);
        const eventModule = await import(`file://${modulePath}`);

        if (!eventModule.config || !eventModule.config.name) {
          console.warn(`Skipping ${file}: missing config or config.name`);
          continue;
        }

        const { config, onStart } = eventModule;

        if (!config.eventType || !Array.isArray(config.eventType)) {
          console.warn(`Skipping ${file}: missing or invalid eventType array`);
          continue;
        }

        loadedEvents.push({
          config,
          onStart,
          file,
        });

        console.log(`Loaded event: ${config.name} (${file})`);
      } catch (error) {
        console.error(`Failed to load event ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Failed to read events directory:", error.message);
  }
}

/**
 * Registers all loaded commands with the bot
 */
function registerCommands() {
  // First, register onChat middlewares (like logger)
  for (const cmd of loadedCommands) {
    if (cmd.onChat) {
      bot.use(async (ctx, next) => {
        // Execute onChat handler
        await cmd.onChat({ ctx });
        // Always pass to next middleware
        await next();
      });
      console.log(`Registered middleware: ${cmd.config.name}`);
    }
  }

  // Then, register onStart command handlers
  for (const cmd of loadedCommands) {
    if (cmd.onStart) {
      bot.command(cmd.config.name, async (ctx) => {
        // Check permission
        const isGroup = isGroupChat(ctx);
        const permission = cmd.config.permission;

        // "group" permission = only in groups
        // "user" permission = both private and group
        if (permission === "group" && !isGroup) {
          // Silently ignore group-only commands in private chats
          return;
        }

        // Extract command arguments
        const args = getCommandArgs(ctx);

        // Execute the command handler
        await cmd.onStart({ ctx, args, getCommands });
      });
      console.log(`Registered command: /${cmd.config.name}`);
    }
  }
}

/**
 * Registers all loaded events with the bot
 */
function registerEvents() {
  for (const event of loadedEvents) {
    for (const eventType of event.config.eventType) {
      bot.on(message(eventType), async (ctx) => {
        await event.onStart({ ctx });
      });
      console.log(`Registered event: ${event.config.name} -> ${eventType}`);
    }
  }
}

/**
 * Registers bot commands with Telegram for command menu
 */
async function registerBotCommands() {
  // Filter commands for private chats (permission = "user")
  const privateCommands = loadedCommands
    .filter((cmd) => cmd.config.permission === "user" && cmd.onStart)
    .map((cmd) => ({
      command: cmd.config.name,
      description: cmd.config.description,
    }));

  // Filter commands for group chats (both "user" and "group" permissions)
  const groupCommands = loadedCommands
    .filter((cmd) => cmd.onStart)
    .map((cmd) => ({
      command: cmd.config.name,
      description: cmd.config.description,
    }));

  // Register for private chats
  await bot.telegram.setMyCommands(privateCommands, {
    scope: { type: "all_private_chats" },
  });
  console.log(
    `Private chat commands registered: ${privateCommands.map((c) => c.command).join(", ")}`
  );

  // Register for group chats
  await bot.telegram.setMyCommands(groupCommands, {
    scope: { type: "all_group_chats" },
  });
  console.log(
    `Group chat commands registered: ${groupCommands.map((c) => c.command).join(", ")}`
  );
}

/**
 * Main entry point
 */
async function main() {
  console.log("Starting bot...");

  // Load all modules
  await loadCommands();
  await loadEvents();

  // Register handlers with bot
  registerCommands();
  registerEvents();

  // Register commands with Telegram
  await registerBotCommands();

  // Launch bot
  await bot.launch();
  console.log("Bot is up and running...");

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});