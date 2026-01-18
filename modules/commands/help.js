/**
 * Help command module
 * Displays available commands based on chat type
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

export const config = {
  name: "help",
  description: "How to use the bot",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /help command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {Function} params.getCommands - Function to get all loaded commands
 */
export const onStart = async ({ ctx, getCommands }) => {
  const allCommands = getCommands();
  const isGroup = isGroupChat(ctx);

  // Filter commands based on permission and chat type
  const commandsToShow = allCommands.filter((cmd) => {
    if (cmd.permission === "group") {
      return isGroup;
    }
    return true; // "user" permission shows in both private and group
  });

  const commandList = commandsToShow
    .map((cmd) => `/${cmd.name} - ${cmd.description}`)
    .join("\n");

  await ctx.reply(`List of all commands:\n${commandList}`, {
    reply_to_message_id: ctx.message.message_id,
  });
};