/**
 * UID command module
 * Displays user's Telegram ID and info with additional options
 */

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
 * Generates user info message
 * @param {object} from - Telegram user object
 * @param {object} chat - Telegram chat object (optional, for group info)
 * @param {boolean} showChat - Whether to show chat info
 * @returns {string} Formatted user info message
 */
function generateUserInfo(from, chat = null, showChat = false) {
  const userId = from.id;
  const firstName = from.first_name || "Unknown";
  const lastName = from.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const username = from.username ? `@${from.username}` : "(not set)";
  const isPremium = from.is_premium ? "✅ Yes" : "❌ No";
  const isBot = from.is_bot ? "🤖 Yes" : "👤 No";
  const languageCode = from.language_code?.toUpperCase() || "Unknown";

  const lines = [
    `👤 *Your Telegram Info*`,
    ``,
    `*User ID:* \`${userId}\``,
    `*Name:* ${fullName}`,
    `*Username:* ${username}`,
    `*Language:* ${languageCode}`,
    `*Premium:* ${isPremium}`,
    `*Is Bot:* ${isBot}`,
  ];

  if (showChat && chat) {
    lines.push(
      ``,
      `💬 *Chat Info*`,
      `*Chat ID:* \`${chat.id}\``,
      `*Type:* ${chat.type}`,
      `*Title:* ${chat.title || "(Private chat)"}`
    );
  }

  lines.push(``, `_Tap the IDs to copy them!_`);

  return lines.join("\n");
}

export const config = {
  name: "uid",
  description: "Get your Telegram user ID",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /uid command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, Markup }) => {
  const isGroup = isGroupChat(ctx);
  const userInfo = generateUserInfo(ctx.from, ctx.chat, false);

  const keyboardButtons = [
    [Markup.button.callback("🔄 Refresh", "uid_refresh")],
  ];

  // In groups, add option to show chat info
  if (isGroup) {
    keyboardButtons[0].push(Markup.button.callback("💬 Chat Info", "uid_chat"));
  }

  const keyboard = Markup.inlineKeyboard(keyboardButtons);

  await ctx.reply(userInfo, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "Markdown",
    ...keyboard,
  });
};

/**
 * Callback action handlers for uid command buttons
 */
export const actions = {
  uid_refresh: async ({ ctx }) => {
    const isGroup = isGroupChat(ctx);
    const userInfo = generateUserInfo(ctx.from, ctx.chat, false);

    const keyboardButtons = [
      [{ text: "🔄 Refresh", callback_data: "uid_refresh" }],
    ];

    if (isGroup) {
      keyboardButtons[0].push({ text: "💬 Chat Info", callback_data: "uid_chat" });
    }

    await ctx.editMessageText(userInfo, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboardButtons },
    });
  },

  uid_chat: async ({ ctx }) => {
    const userInfo = generateUserInfo(ctx.from, ctx.chat, true);

    await ctx.editMessageText(userInfo, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 Refresh", callback_data: "uid_chat" },
            { text: "👤 User Only", callback_data: "uid_refresh" },
          ],
        ],
      },
    });
  },
};