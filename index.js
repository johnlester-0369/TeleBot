import "dotenv/config";
import { Telegraf } from "telegraf";
import moment from "moment-timezone";

const bot = new Telegraf(process.env.BOT_TOKEN);

const commands = [
  { command: "start", description: "Start bot" },
  { command: "help", description: "How to use the bot" },
  { command: "uid", description: "Get your Telegram user ID" },
  { command: "system", description: "View bot system information" },
];

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

async function main() {
  console.log("Starting bot...");
  // Register commands for Telegram UI
  await bot.telegram.setMyCommands(commands);
  console.log(
    "Bot commands registered:",
    commands.map((c) => c.command).join(", "),
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
    await ctx.reply(
      `List of all commands:\n${commands
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

  // --- Single logger for all messages ---
  bot.on("message", (ctx) => {
    const from = ctx.from.username ? `@${ctx.from.username}` : ctx.from.id;
    const text = ctx.message.text || "<non-text message>";
    console.log(`Received message from ${from}: ${text}`);
  });

  // Launch bot
  await bot.launch();
  console.log("Bot is up and running...");

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => console.error(err));
