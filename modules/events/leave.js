/**
 * Leave event module
 * Handles chat members leaving a group
 */

/**
 * Formats user display name from Telegram user object
 * @param {object} user - Telegram user object
 * @returns {string} Formatted display name
 */
function formatUserDisplayName(user) {
  if (!user) return "Unknown User";

  let name = user.first_name || "";
  if (user.last_name) {
    name += ` ${user.last_name}`;
  }
  return name.trim() || "Unknown User";
}

/**
 * Formats user mention with optional username
 * @param {object} user - Telegram user object
 * @returns {string} Formatted user mention string
 */
function formatUserMention(user) {
  if (!user) return "Unknown User";

  const displayName = formatUserDisplayName(user);
  if (user.username) {
    return `${displayName} (@${user.username})`;
  }
  return displayName;
}

export const config = {
  name: "leave",
  description: "Says goodbye to members leaving the group",
  eventType: ["left_chat_member"],
};

/**
 * Handler for left_chat_member event
 * @param {object} params - Event parameters
 * @param {object} params.ctx - Telegraf context object
 */
export const onStart = async ({ ctx }) => {
  try {
    const leftMember = ctx.message.left_chat_member;
    const chatTitle = ctx.chat.title || "the group";

    // Skip if the member who left is a bot
    if (leftMember.is_bot) {
      console.log(
        `Bot ${leftMember.first_name} (${leftMember.id}) left ${chatTitle}`
      );
      return;
    }

    const displayName = formatUserDisplayName(leftMember);
    const farewellMessage = `👋 Goodbye, ${displayName}! We hope to see you again soon.`;

    await ctx.reply(farewellMessage);

    console.log(
      `Member left: ${formatUserMention(leftMember)} left "${chatTitle}" (chat ${ctx.chat.id})`
    );
  } catch (error) {
    console.error("Error in left_chat_member handler:", error);
  }
};