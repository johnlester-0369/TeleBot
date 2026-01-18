/**
 * Start command module
 * Welcomes user when they start the bot
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
 */
export const onStart = async ({ ctx }) => {
  await ctx.reply(
    `Welcome, ${ctx.from.first_name}! Use /help to see available commands.`,
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
};