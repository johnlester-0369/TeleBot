/**
 * QR command module
 * Generates QR codes from text
 */

import qr from "qr-image";

/**
 * Generates a QR code image stream from text
 * @param {string} text - Text to encode in QR code
 * @returns {import('stream').Readable} PNG image stream
 */
function generateQRCode(text) {
  return qr.image(text, { type: "png" });
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
 */
export const onStart = async ({ ctx, args }) => {
  try {
    const textToEncode = args;

    // Validate: text must be provided
    if (!textToEncode) {
      await ctx.reply(
        "⚠️ Please provide text to generate a QR code.\nUsage: /qr <text>\nExample: /qr https://example.com",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
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

    // Generate QR code as PNG stream
    const qrStream = generateQRCode(textToEncode);

    // Prepare caption (truncate if text is too long for display)
    const displayText =
      textToEncode.length > 100
        ? `${textToEncode.substring(0, 100)}...`
        : textToEncode;
    const caption = `📱 QR Code for:\n${displayText}`;

    // Send the QR code image as a photo
    await ctx.replyWithPhoto(
      { source: qrStream },
      {
        caption: caption,
        reply_to_message_id: ctx.message.message_id,
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