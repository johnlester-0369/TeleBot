/**
 * Set Group Name command module
 * Changes group name (admin only, group chats only)
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
  name: "setgroupname",
  description: "Set group name (admin only)",
  permission: "group", // Only available in group chats
};

/**
 * Handler for /setgroupname command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {string} params.args - Command arguments (new group name)
 */
export const onStart = async ({ ctx, args }) => {
  try {
    // Validate: only works in group chats
    if (!isGroupChat(ctx)) {
      await ctx.reply(
        "⚠️ This command can only be used in group or supergroup chats.",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    const newName = args;

    // Validate: new name must be provided
    if (!newName) {
      await ctx.reply(
        "⚠️ Please provide a new group name.\nUsage: /setgroupname <new name>\nExample: /setgroupname My Awesome Group",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    // Validate: Telegram group titles must be 1-128 characters
    if (newName.length > 128) {
      await ctx.reply(
        "⚠️ Group name is too long. Maximum length is 128 characters.",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    // Attempt to change the group title
    await ctx.setChatTitle(newName);

    await ctx.reply(`✅ Group name has been changed to: "${newName}"`, {
      reply_to_message_id: ctx.message.message_id,
    });

    console.log(
      `Group name changed to "${newName}" by @${ctx.from.username || ctx.from.id} in chat ${ctx.chat.id}`
    );
  } catch (error) {
    console.error("Error in /setgroupname command:", error);

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
};