/**
 * System command module
 * Displays bot system information with refresh button
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

/**
 * Generates system information message
 * @returns {string} Formatted system info message
 */
function generateSystemInfo() {
  const uptime = formatUptime(process.uptime());
  const nodeVersion = process.version;
  const memory = formatMemory(process.memoryUsage().rss);
  const heapUsed = formatMemory(process.memoryUsage().heapUsed);
  const platform = `${process.platform} ${process.arch}`;
  const time = moment().tz("Asia/Manila").format("LLL");
  const cpuUsage = process.cpuUsage();
  const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

  return [
    `⚙️ *Bot System Information*`,
    ``,
    `📊 *Runtime Stats*`,
    `• Uptime: \`${uptime}\``,
    `• Node.js: \`${nodeVersion}\``,
    ``,
    `💾 *Memory Usage*`,
    `• RSS: \`${memory}\``,
    `• Heap: \`${heapUsed}\``,
    ``,
    `🖥️ *System*`,
    `• Platform: \`${platform}\``,
    `• CPU Time: \`${cpuPercent}s\``,
    ``,
    `📅 *Current Time*`,
    `• ${time} (Asia/Manila)`,
  ].join("\n");
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
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, Markup }) => {
  try {
    const systemInfo = generateSystemInfo();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🔄 Refresh", "system_refresh"),
        Markup.button.callback("📊 Detailed", "system_detailed"),
      ],
    ]);

    await ctx.reply(systemInfo, {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "Markdown",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error in /system command:", error);
    await ctx.reply("An error occurred while fetching system information.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }
};

/**
 * Callback action handlers for system command buttons
 */
export const actions = {
  system_refresh: async ({ ctx }) => {
    try {
      const systemInfo = generateSystemInfo();

      await ctx.editMessageText(systemInfo, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh", callback_data: "system_refresh" },
              { text: "📊 Detailed", callback_data: "system_detailed" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error refreshing system info:", error);
    }
  },

  system_detailed: async ({ ctx }) => {
    try {
      const uptime = formatUptime(process.uptime());
      const memUsage = process.memoryUsage();
      const time = moment().tz("Asia/Manila").format("LLLL");

      const detailedInfo = [
        `📊 *Detailed System Information*`,
        ``,
        `⏱️ *Uptime*`,
        `\`${uptime}\``,
        ``,
        `📦 *Node.js*`,
        `• Version: \`${process.version}\``,
        `• V8: \`${process.versions.v8}\``,
        `• OpenSSL: \`${process.versions.openssl}\``,
        ``,
        `💾 *Memory (MB)*`,
        `• RSS: \`${(memUsage.rss / 1024 / 1024).toFixed(2)}\``,
        `• Heap Total: \`${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}\``,
        `• Heap Used: \`${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}\``,
        `• External: \`${(memUsage.external / 1024 / 1024).toFixed(2)}\``,
        ``,
        `🖥️ *Environment*`,
        `• Platform: \`${process.platform}\``,
        `• Arch: \`${process.arch}\``,
        `• PID: \`${process.pid}\``,
        ``,
        `📅 *Timestamp*`,
        `${time}`,
      ].join("\n");

      await ctx.editMessageText(detailedInfo, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh", callback_data: "system_detailed" },
              { text: "« Simple", callback_data: "system_simple" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error showing detailed system info:", error);
    }
  },

  system_simple: async ({ ctx }) => {
    try {
      const systemInfo = generateSystemInfo();

      await ctx.editMessageText(systemInfo, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Refresh", callback_data: "system_refresh" },
              { text: "📊 Detailed", callback_data: "system_detailed" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error showing simple system info:", error);
    }
  },
};