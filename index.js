import "dotenv/config";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

const commands = [
  { command: "start", description: "Start bot" },
  { command: "help", description: "How to use the bot" },
  { command: "uid", description: "Get your Telegram user ID" },
];

async function main() {
  console.log("Starting bot...");
  // Register commands for Telegram UI
  await bot.telegram.setMyCommands(commands);
  console.log("Bot commands registered:", commands.map(c => c.command).join(", "));

  // /start handler
  bot.start(async (ctx) => {
    await ctx.reply(`Welcome, ${ctx.from.first_name}! Use /help to see available commands.`);
  });

  // /help handler
  bot.help(async (ctx) => {
    await ctx.reply(
      `List of all commands:\n${commands
        .map((cmd) => `/${cmd.command} - ${cmd.description}`)
        .join("\n")}`
    );
  });

  // /uid handler
  bot.command("uid", async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username ? `@${ctx.from.username}` : "(no username)";
    await ctx.reply(
      `Your Telegram info:\nID: ${userId}\nName: ${firstName}\nUsername: ${username}`
    );
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
