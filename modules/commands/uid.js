/**
 * UID command module
 * Displays user's Telegram ID and info
 */

export const config = {
  name: "uid",
  description: "Get your Telegram user ID",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /uid command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 */
export const onStart = async ({ ctx }) => {
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name;
  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : "(no username)";

  await ctx.reply(
    `Your Telegram info:\nID: ${userId}\nName: ${firstName}\nUsername: ${username}`,
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
};