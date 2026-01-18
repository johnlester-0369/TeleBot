/**
 * Join event module
 * Handles new chat members joining a group
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
  name: "join",
  description: "Welcomes new members to the group",
  eventType: ["new_chat_members"],
};

/**
 * Handler for new_chat_members event
 * @param {object} params - Event parameters
 * @param {object} params.ctx - Telegraf context object
 */
export const onStart = async ({ ctx }) => {
  try {
    const newMembers = ctx.message.new_chat_members;
    const chatTitle = ctx.chat.title || "this group";

    for (const member of newMembers) {
      // Skip if the new member is a bot
      if (member.is_bot) {
        console.log(
          `Bot ${member.first_name} (${member.id}) joined ${chatTitle}`
        );
        continue;
      }

      const displayName = formatUserDisplayName(member);
      const welcomeMessage = [
        `👋 Welcome to *${chatTitle}*, ${displayName}!`,
        ``,
        `We're glad to have you here. Feel free to introduce yourself and enjoy your stay!`,
        ``,
        `💡 Type /help to see available commands.`,
      ].join("\n");

      await ctx.reply(welcomeMessage, {
        parse_mode: "Markdown",
      });

      console.log(
        `New member: ${formatUserMention(member)} joined "${chatTitle}" (chat ${ctx.chat.id})`
      );
    }
  } catch (error) {
    console.error("Error in new_chat_members handler:", error);
  }
};