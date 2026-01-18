/**
 * System command module
 * Displays bot system information
 */

import moment from "moment-timezone";

/**
 * Formats uptime seconds into human-readable string (Xh Xm Xs)
 * @param {number} uptimeSeconds - Uptime in seconds from process.uptime()
 * @returns {string} Formatted uptime string
 */
function formatUptime(uptimeSeconds) {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Formats bytes into megabytes with one decimal place
 * @param {number} bytes - Memory in bytes
 * @returns {string} Formatted memory string with MB suffix
 */
function formatMemory(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

export const config = {
  name: "system",
  description: "View bot system information",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /system command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 */
export const onStart = async ({ ctx }) => {
  try {
    const uptime = formatUptime(process.uptime());
    const nodeVersion = process.version;
    const memory = formatMemory(process.memoryUsage().rss);
    const platform = `${process.platform} ${process.arch}`;
    const time = moment().tz("Asia/Manila").format("LLL");

    const systemInfo = [
      `• Uptime: ${uptime}`,
      `• Node.js: ${nodeVersion}`,
      `• Memory: ${memory}`,
      `• Platform: ${platform}`,
      `• Date: ${time}`,
    ].join("\n");

    await ctx.reply(systemInfo, {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    console.error("Error in /system command:", error);
    await ctx.reply("An error occurred while fetching system information.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }
};