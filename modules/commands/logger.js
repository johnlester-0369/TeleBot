/**
 * Logger middleware module
 * Logs all incoming updates (uses onChat, not onStart)
 */

/**
 * Determines the update type for logging purposes
 * @param {object} ctx - Telegraf context object
 * @returns {string} Human-readable update type
 */
function getUpdateType(ctx) {
  if (ctx.message?.text?.startsWith("/")) return "command";
  if (ctx.message?.new_chat_members) return "new_chat_members";
  if (ctx.message?.left_chat_member) return "left_chat_member";
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

export const config = {
  name: "logger",
  description: "Logs all incoming updates",
  permission: "user", // Runs for all chats
};

/**
 * Middleware handler for logging all updates
 * This uses onChat because it's a middleware, not a command
 * @param {object} params - Middleware parameters
 * @param {object} params.ctx - Telegraf context object
 */
export const onChat = async ({ ctx }) => {
  try {
    const from = ctx.from?.username
      ? `@${ctx.from.username}`
      : ctx.from?.id ?? "unknown";
    const updateType = getUpdateType(ctx);
    const content =
      ctx.message?.text || ctx.callbackQuery?.data || `<${updateType}>`;

    console.log(`[${updateType.toUpperCase()}] from ${from}: ${content}`);
  } catch (error) {
    console.error("Error in logging middleware:", error);
  }
};