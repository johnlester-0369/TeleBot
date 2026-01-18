import "dotenv/config";
import { Telegraf } from "telegraf";
import moment from "moment-timezone";

const bot = new Telegraf(process.env.BOT_TOKEN);

// Commands for all chats (private + group)
const defaultCommands = [
  { command: "start", description: "Start bot" },
  { command: "help", description: "How to use the bot" },
  { command: "uid", description: "Get your Telegram user ID" },
  { command: "system", description: "View bot system information" },
];

// Commands only for group chats
const groupCommands = [
  ...defaultCommands,
  { command: "setgroupname", description: "Set group name (admin only)" },
];

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
 * Formats uptime seconds into human-readable string (Xh Xm Xs)
 * @param {number} uptimeSeconds - Uptime in seconds from process.uptime()
 * @returns {string} Formatted uptime string
 */
function formatUptime(uptimeSeconds) {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Formats bytes into megabytes with one decimal place
 * @param {number} bytes - Memory in bytes
 * @returns {string} Formatted memory string with MB suffix
 */
function formatMemory(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

/**
 * Determines the update type for logging purposes
 * @param {object} ctx - Telegraf context object
 * @returns {string} Human-readable update type
 */
function getUpdateType(ctx) {
  if (ctx.message?.text?.startsWith("/")) return "command";
  if (ctx.message?.text) return "text";
  if (ctx.message?.sticker) return "sticker";
  if (ctx.message?.photo) return "photo";
  if (ctx.message?.video) return "video";
  if (ctx.message?.document) return "document";
  if (ctx.message?.voice) return "voice";
  if (ctx.message?.audio) return "audio";
  if (ctx.callbackQuery) return "callback_query";
  if (ctx.inlineQuery) return "inline_query";
  if (ctx.message) return "message";
  return "update";
}

async function main() {
  console.log("Starting bot...");

  // ============================================================
  // LOGGING MIDDLEWARE - Runs for ALL updates (including commands)
  // Must be registered BEFORE command handlers to intercept all updates
  // ============================================================
  /**
   * Universal logging middleware that logs all incoming updates.
   * Uses next() to pass control to subsequent handlers.
   * @param {object} ctx - Telegraf context object
   * @param {Function} next - Function to call next middleware
   */
  bot.use(async (ctx, next) => {
    try {
      const from = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.id ?? "unknown";
      const updateType = getUpdateType(ctx);
      const content = ctx.message?.text || ctx.callbackQuery?.data || `<${updateType}>`;

      console.log(`[${updateType.toUpperCase()}] from ${from}: ${content}`);

      // CRITICAL: Call next() to pass control to command handlers
      await next();
    } catch (error) {
      console.error("Error in logging middleware:", error);
      // Still call next() to not break the chain
      await next();
    }
  });

  // Register default commands for private chats
  await bot.telegram.setMyCommands(defaultCommands, {
    scope: { type: "all_private_chats" },
  });
  console.log(
    "Private chat commands registered:",
    defaultCommands.map((c) => c.command).join(", "),
  );

  // Register commands including setgroupname for group chats only
  await bot.telegram.setMyCommands(groupCommands, {
    scope: { type: "all_group_chats" },
  });
  console.log(
    "Group chat commands registered:",
    groupCommands.map((c) => c.command).join(", "),
  );

  // /start handler
  bot.start(async (ctx) => {
    await ctx.reply(
      `Welcome, ${ctx.from.first_name}! Use /help to see available commands.`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /help handler
  bot.help(async (ctx) => {
    // Show different commands based on chat type
    const commandsToShow = isGroupChat(ctx) ? groupCommands : defaultCommands;
    await ctx.reply(
      `List of all commands:\n${commandsToShow
        .map((cmd) => `/${cmd.command} - ${cmd.description}`)
        .join("\n")}`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /uid handler
  bot.command("uid", async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : "(no username)";
    await ctx.reply(
      `Your Telegram info:\nID: ${userId}\nName: ${firstName}\nUsername: ${username}`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /system handler - displays bot system information
  bot.command("system", async (ctx) => {
    try {
      const uptime = formatUptime(process.uptime());
      const nodeVersion = process.version;
      const memory = formatMemory(process.memoryUsage().rss);
      const platform = `${process.platform} ${process.arch}`;
      const time = moment().tz("Asia/Manila").format("LLL");

      const systemInfo = [
        `• Uptime: ${uptime}`,
        `• Node.js: ${nodeVersion}`,
        `• Memory: ${memory}`,
        `• Platform: ${platform}`,
        `• Date: ${time}`,
      ].join("\n");

      await ctx.reply(systemInfo, {
        reply_to_message_id: ctx.message.message_id,
      });
    } catch (error) {
      console.error("Error in /system command:", error);
      await ctx.reply("An error occurred while fetching system information.", {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // /setgroupname handler - changes the group name (admin only, group chats only)
  bot.command("setgroupname", async (ctx) => {
    try {
      // Validate: only works in group chats
      if (!isGroupChat(ctx)) {
        await ctx.reply(
          "⚠️ This command can only be used in group or supergroup chats.",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Get the new group name from command arguments
      const newName = getCommandArgs(ctx);

      // Validate: new name must be provided
      if (!newName) {
        await ctx.reply(
          "⚠️ Please provide a new group name.\nUsage: /setgroupname <new name>\nExample: /setgroupname My Awesome Group",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Validate: Telegram group titles must be 1-128 characters
      if (newName.length > 128) {
        await ctx.reply(
          "⚠️ Group name is too long. Maximum length is 128 characters.",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Attempt to change the group title
      await ctx.setChatTitle(newName);

      await ctx.reply(`✅ Group name has been changed to: "${newName}"`, {
        reply_to_message_id: ctx.message.message_id,
      });

      console.log(
        `Group name changed to "${newName}" by @${ctx.from.username || ctx.from.id} in chat ${ctx.chat.id}`,
      );
    } catch (error) {
      console.error("Error in /setgroupname command:", error);

      // Handle specific Telegram API errors
      let errorMessage = "An error occurred while changing the group name.";

      if (error.description) {
        if (error.description.includes("not enough rights")) {
          errorMessage =
            "⚠️ I don't have permission to change the group name. Please make me an admin with 'Change Group Info' permission.";
        } else if (error.description.includes("CHAT_TITLE_NOT_MODIFIED")) {
          errorMessage = "⚠️ The group name is already set to this value.";
        } else if (
          error.description.includes("CHAT_NOT_MODIFIED") ||
          error.description.includes("chat title is not modified")
        ) {
          errorMessage = "⚠️ The group name is already set to this value.";
        } else {
          errorMessage = `⚠️ Failed to change group name: ${error.description}`;
        }
      }

      await ctx.reply(errorMessage, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // NOTE: The old bot.on("message") handler has been REMOVED.
  // Logging is now handled by the bot.use() middleware above,
  // which runs for ALL updates including commands.

  // Launch bot
  await bot.launch();
  console.log("Bot is up and running...");

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => console.error(err));