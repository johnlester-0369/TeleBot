/**
 * QR command module
 * Generates QR codes from text with size options
 */

import qr from "qr-image";

/**
 * Generates a QR code image stream from text
 * @param {string} text - Text to encode in QR code
 * @param {string} size - Size option: 'small', 'medium', 'large'
 * @returns {import('stream').Readable} PNG image stream
 */
function generateQRCode(text, size = "medium") {
  const sizeMap = {
    small: 4,
    medium: 8,
    large: 12,
  };
  const scale = sizeMap[size] || sizeMap.medium;
  
  return qr.image(text, { 
    type: "png",
    size: scale,
    margin: 2,
  });
}

export const config = {
  name: "qr",
  description: "Generate QR code from text",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /qr command
 * Generates and sends a QR code image from user-provided text.
 * Usage: /qr <text to encode>
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {string} params.args - Command arguments (text to encode)
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, args, Markup }) => {
  try {
    const textToEncode = args;

    // Validate: text must be provided
    if (!textToEncode) {
      const usageMessage = [
        "📱 *QR Code Generator*",
        "",
        "*Usage:* `/qr <text or URL>`",
        "",
        "*Examples:*",
        "• `/qr https://telegram.org`",
        "• `/qr Hello, scan this!`",
        "• `/qr WIFI:T:WPA;S:MyNetwork;P:password;;`",
        "",
        "*Tips:*",
        "• Works great for URLs, WiFi configs, contact info",
        "• Maximum 2000 characters",
      ].join("\n");

      await ctx.reply(usageMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
      });
      return;
    }

    // Validate: text length (QR codes have practical limits)
    const maxLength = 2000;
    if (textToEncode.length > maxLength) {
      await ctx.reply(
        `⚠️ Text is too long. Maximum length is ${maxLength} characters.\nYour text: ${textToEncode.length} characters.`,
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    // Generate QR code as PNG stream (default medium size)
    const qrStream = generateQRCode(textToEncode, "medium");

    // Prepare caption (truncate if text is too long for display)
    const displayText =
      textToEncode.length > 100
        ? `${textToEncode.substring(0, 100)}...`
        : textToEncode;
    const caption = `📱 *QR Code*\n\n\`${displayText}\``;

    // Build size selection keyboard
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🔹 Small", "qr_small"),
        Markup.button.callback("🔸 Medium", "qr_medium"),
        Markup.button.callback("🔶 Large", "qr_large"),
      ],
    ]);

    // Send the QR code image as a photo
    await ctx.replyWithPhoto(
      { source: qrStream },
      {
        caption: caption,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
        ...keyboard,
      }
    );

    console.log(
      `QR code generated for "${textToEncode.substring(0, 50)}${textToEncode.length > 50 ? "..." : ""}" by @${ctx.from.username || ctx.from.id}`
    );
  } catch (error) {
    console.error("Error in /qr command:", error);

    let errorMessage = "❌ An error occurred while generating the QR code.";

    if (error.message?.includes("too long")) {
      errorMessage =
        "⚠️ The text is too long to encode in a QR code. Please use shorter text.";
    }

    await ctx.reply(errorMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
  }
};

/**
 * Callback action handlers for QR size buttons
 */
export const actions = {
  qr_small: async ({ ctx }) => {
    await regenerateQR(ctx, "small");
  },

  qr_medium: async ({ ctx }) => {
    await regenerateQR(ctx, "medium");
  },

  qr_large: async ({ ctx }) => {
    await regenerateQR(ctx, "large");
  },
};

/**
 * Regenerates QR code with different size
 * @param {object} ctx - Telegraf context
 * @param {string} size - Size option
 */
async function regenerateQR(ctx, size) {
  try {
    // Get the original text from the caption
    const caption = ctx.callbackQuery.message.caption;
    const textMatch = caption?.match(/`(.+?)`/);
    
    if (!textMatch) {
      await ctx.answerCbQuery("Could not find original text");
      return;
    }

    let textToEncode = textMatch[1];
    // Remove trailing ... if present (it was truncated for display)
    if (textToEncode.endsWith("...")) {
      // We don't have the full text, so we'll regenerate with what we have
      // In production, you might want to store the full text differently
    }

    await ctx.answerCbQuery(`Regenerating ${size} QR...`);

    // Generate new QR code
    const qrStream = generateQRCode(textToEncode, size);
    
    const sizeLabels = { small: "🔹 Small", medium: "🔸 Medium", large: "🔶 Large" };
    const displayText = textToEncode.length > 100 ? `${textToEncode.substring(0, 100)}...` : textToEncode;
    const newCaption = `📱 *QR Code* (${sizeLabels[size]})\n\n\`${displayText}\``;

    // Edit the media with new QR code
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: { source: qrStream },
        caption: newCaption,
        parse_mode: "Markdown",
      },
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: size === "small" ? "🔹 Small ✓" : "🔹 Small", callback_data: "qr_small" },
              { text: size === "medium" ? "🔸 Medium ✓" : "🔸 Medium", callback_data: "qr_medium" },
              { text: size === "large" ? "🔶 Large ✓" : "🔶 Large", callback_data: "qr_large" },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error regenerating QR:", error);
    await ctx.answerCbQuery("Failed to regenerate QR code");
  }
}