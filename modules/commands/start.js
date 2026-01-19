/**
 * Start command module
 * Welcomes user when they start the bot with quick action buttons
 */

export const config = {
  name: "start",
  description: "Start bot",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /start command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, Markup }) => {
  const firstName = ctx.from.first_name || "there";
  
  const welcomeMessage = [
    `👋 *Welcome, ${firstName}!*`,
    ``,
    `I'm TeleBot, your helpful assistant. Here's what I can do:`,
    ``,
    `🔤 *Translation & Speech*`,
    `• Translate text between 100+ languages`,
    `• Convert text to speech audio`,
    ``,
    `📱 *Utilities*`,
    `• Generate QR codes from text/URLs`,
    `• Get your Telegram user info`,
    `• View bot system status`,
    ``,
    `Use the buttons below or type /help for all commands.`,
  ].join("\n");

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("📚 Help", "start_help"),
      Markup.button.callback("👤 My Info", "start_uid"),
    ],
    [
      Markup.button.callback("🌐 Translate", "start_trans"),
      Markup.button.callback("🔊 Text to Speech", "start_say"),
    ],
    [
      Markup.button.callback("📱 QR Generator", "start_qr"),
      Markup.button.callback("⚙️ System", "start_system"),
    ],
  ]);

  await ctx.reply(welcomeMessage, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "Markdown",
    ...keyboard,
  });
};

/**
 * Callback action handlers for start command buttons
 */
export const actions = {
  start_help: async ({ ctx }) => {
    const helpMessage = [
      `📚 *Available Commands*`,
      ``,
      `/help - View all commands with details`,
      `/trans <text> | <lang> - Translate text`,
      `/say <text> | <lang> - Text to speech`,
      `/qr <text> - Generate QR code`,
      `/uid - Get your user ID`,
      `/system - Bot system info`,
      ``,
      `_Tip: Use the buttons or type commands directly!_`,
    ].join("\n");

    await ctx.editMessageText(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back to Start", callback_data: "start_back" }],
        ],
      },
    });
  },

  start_uid: async ({ ctx }) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || "Unknown";
    const lastName = ctx.from.last_name || "";
    const username = ctx.from.username ? `@${ctx.from.username}` : "(not set)";
    const fullName = `${firstName} ${lastName}`.trim();

    const uidMessage = [
      `👤 *Your Telegram Info*`,
      ``,
      `• *ID:* \`${userId}\``,
      `• *Name:* ${fullName}`,
      `• *Username:* ${username}`,
      ``,
      `_Tap the ID to copy it!_`,
    ].join("\n");

    await ctx.editMessageText(uidMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back to Start", callback_data: "start_back" }],
        ],
      },
    });
  },

  start_trans: async ({ ctx }) => {
    const transMessage = [
      `🌐 *Translation Command*`,
      ``,
      `*Usage:*`,
      `• \`/trans <text> | <lang>\` - Translate to language`,
      `• \`/trans <text>\` - Translate to English`,
      `• Reply to a message with \`/trans | <lang>\``,
      ``,
      `*Examples:*`,
      `• \`/trans Hello | ko\` → Korean`,
      `• \`/trans Bonjour | ja\` → Japanese`,
      ``,
      `*Common language codes:*`,
      `\`en\` English • \`ko\` Korean • \`ja\` Japanese`,
      `\`zh\` Chinese • \`fr\` French • \`es\` Spanish`,
    ].join("\n");

    await ctx.editMessageText(transMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back to Start", callback_data: "start_back" }],
        ],
      },
    });
  },

  start_say: async ({ ctx }) => {
    const sayMessage = [
      `🔊 *Text-to-Speech Command*`,
      ``,
      `*Usage:*`,
      `• \`/say <text> | <lang>\` - Speak in language`,
      `• \`/say <text>\` - Speak in English`,
      `• Reply to a message with \`/say | <lang>\``,
      ``,
      `*Examples:*`,
      `• \`/say Hello world | en\``,
      `• \`/say 안녕하세요 | ko\``,
      ``,
      `*Note:* Max 200 characters per request.`,
    ].join("\n");

    await ctx.editMessageText(sayMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back to Start", callback_data: "start_back" }],
        ],
      },
    });
  },

  start_qr: async ({ ctx }) => {
    const qrMessage = [
      `📱 *QR Code Generator*`,
      ``,
      `*Usage:*`,
      `\`/qr <text or URL>\``,
      ``,
      `*Examples:*`,
      `• \`/qr https://telegram.org\``,
      `• \`/qr Hello, scan this!\``,
      `• \`/qr WIFI:T:WPA;S:MyNetwork;P:password;;\``,
      ``,
      `*Tip:* Works great for URLs, WiFi configs, and contact info!`,
    ].join("\n");

    await ctx.editMessageText(qrMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "« Back to Start", callback_data: "start_back" }],
        ],
      },
    });
  },

  start_system: async ({ ctx }) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    
    const memory = process.memoryUsage().rss / (1024 * 1024);

    const systemMessage = [
      `⚙️ *Bot System Status*`,
      ``,
      `• *Uptime:* ${uptimeStr}`,
      `• *Node.js:* ${process.version}`,
      `• *Memory:* ${memory.toFixed(1)} MB`,
      `• *Platform:* ${process.platform} ${process.arch}`,
      ``,
      `_Use /system for detailed info_`,
    ].join("\n");

    await ctx.editMessageText(systemMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 Refresh", callback_data: "start_system" },
            { text: "« Back", callback_data: "start_back" },
          ],
        ],
      },
    });
  },

  start_back: async ({ ctx, Markup }) => {
    const firstName = ctx.from.first_name || "there";
    
    const welcomeMessage = [
      `👋 *Welcome, ${firstName}!*`,
      ``,
      `I'm TeleBot, your helpful assistant. Here's what I can do:`,
      ``,
      `🔤 *Translation & Speech*`,
      `• Translate text between 100+ languages`,
      `• Convert text to speech audio`,
      ``,
      `📱 *Utilities*`,
      `• Generate QR codes from text/URLs`,
      `• Get your Telegram user info`,
      `• View bot system status`,
      ``,
      `Use the buttons below or type /help for all commands.`,
    ].join("\n");

    await ctx.editMessageText(welcomeMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📚 Help", callback_data: "start_help" },
            { text: "👤 My Info", callback_data: "start_uid" },
          ],
          [
            { text: "🌐 Translate", callback_data: "start_trans" },
            { text: "🔊 Text to Speech", callback_data: "start_say" },
          ],
          [
            { text: "📱 QR Generator", callback_data: "start_qr" },
            { text: "⚙️ System", callback_data: "start_system" },
          ],
        ],
      },
    });
  },
};