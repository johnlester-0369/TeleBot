import "dotenv/config";
import { Telegraf, Input } from "telegraf";
import { message } from "telegraf/filters";
import moment from "moment-timezone";
import qr from "qr-image";
import axios from "axios";

const bot = new Telegraf(process.env.BOT_TOKEN);

// Commands for all chats (private + group)
const defaultCommands = [
  { command: "start", description: "Start bot" },
  { command: "help", description: "How to use the bot" },
  { command: "uid", description: "Get your Telegram user ID" },
  { command: "system", description: "View bot system information" },
  { command: "qr", description: "Generate QR code from text" },
  { command: "trans", description: "Translate text to another language" },
  { command: "say", description: "Convert text to speech audio" },
];

// Commands only for group chats
const groupCommands = [
  ...defaultCommands,
  { command: "setgroupname", description: "Set group name (admin only)" },
];

/**
 * Supported language codes for translation
 * Key: language code, Value: language name
 */
const SUPPORTED_LANGUAGES = {
  af: "Afrikaans",
  sq: "Albanian",
  ar: "Arabic",
  hy: "Armenian",
  az: "Azerbaijani",
  eu: "Basque",
  be: "Belarusian",
  bn: "Bengali",
  bs: "Bosnian",
  bg: "Bulgarian",
  ca: "Catalan",
  ceb: "Cebuano",
  zh: "Chinese (Simplified)",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  hr: "Croatian",
  cs: "Czech",
  da: "Danish",
  nl: "Dutch",
  en: "English",
  eo: "Esperanto",
  et: "Estonian",
  fil: "Filipino",
  fi: "Finnish",
  fr: "French",
  gl: "Galician",
  ka: "Georgian",
  de: "German",
  el: "Greek",
  gu: "Gujarati",
  ht: "Haitian Creole",
  ha: "Hausa",
  he: "Hebrew",
  hi: "Hindi",
  hmn: "Hmong",
  hu: "Hungarian",
  is: "Icelandic",
  ig: "Igbo",
  id: "Indonesian",
  ga: "Irish",
  it: "Italian",
  ja: "Japanese",
  jv: "Javanese",
  kn: "Kannada",
  kk: "Kazakh",
  km: "Khmer",
  ko: "Korean",
  lo: "Lao",
  la: "Latin",
  lv: "Latvian",
  lt: "Lithuanian",
  mk: "Macedonian",
  mg: "Malagasy",
  ms: "Malay",
  ml: "Malayalam",
  mt: "Maltese",
  mi: "Maori",
  mr: "Marathi",
  mn: "Mongolian",
  my: "Myanmar (Burmese)",
  ne: "Nepali",
  no: "Norwegian",
  ny: "Nyanja (Chichewa)",
  or: "Odia (Oriya)",
  ps: "Pashto",
  fa: "Persian",
  pl: "Polish",
  pt: "Portuguese",
  pa: "Punjabi",
  ro: "Romanian",
  ru: "Russian",
  sm: "Samoan",
  gd: "Scots Gaelic",
  sr: "Serbian",
  st: "Sesotho",
  sn: "Shona",
  sd: "Sindhi",
  si: "Sinhala (Sinhalese)",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  es: "Spanish",
  su: "Sundanese",
  sw: "Swahili",
  sv: "Swedish",
  tl: "Tagalog (Filipino)",
  tg: "Tajik",
  ta: "Tamil",
  tt: "Tatar",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  tk: "Turkmen",
  uk: "Ukrainian",
  ur: "Urdu",
  ug: "Uyghur",
  uz: "Uzbek",
  vi: "Vietnamese",
  cy: "Welsh",
  xh: "Xhosa",
  yi: "Yiddish",
  yo: "Yoruba",
  zu: "Zulu",
};

/**
 * Checks if the current chat is a group or supergroup
 * @param {object} ctx - Telegraf context object
 * @returns {boolean} True if chat is a group or supergroup
 */
function isGroupChat(ctx) {
  const chatType = ctx.chat?.type;
  return chatType === "group" || chatType === "supergroup";
}

/**
 * Extracts the command argument text from message
 * @param {object} ctx - Telegraf context object
 * @returns {string} The text after the command, trimmed
 */
function getCommandArgs(ctx) {
  const text = ctx.message?.text || "";
  const match = text.match(/^\/\w+(?:@\w+)?\s*(.*)/);
  return match ? match[1].trim() : "";
}

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
 * Determines the update type for logging purposes
 * @param {object} ctx - Telegraf context object
 * @returns {string} Human-readable update type
 */
function getUpdateType(ctx) {
  if (ctx.message?.text?.startsWith("/")) return "command";
  if (ctx.message?.new_chat_members) return "new_chat_members";
  if (ctx.message?.left_chat_member) return "left_chat_member";
  if (ctx.message?.text) return "text";
  if (ctx.message?.sticker) return "sticker";
  if (ctx.message?.photo) return "photo";
  if (ctx.message?.video) return "video";
  if (ctx.message?.document) return "document";
  if (ctx.message?.voice) return "voice";
  if (ctx.message?.audio) return "audio";
  if (ctx.callbackQuery) return "callback_query";
  if (ctx.inlineQuery) return "inline_query";
  if (ctx.message) return "message";
  return "update";
}

/**
 * Generates a QR code image stream from text
 * @param {string} text - Text to encode in QR code
 * @returns {import('stream').Readable} PNG image stream
 */
function generateQRCode(text) {
  return qr.image(text, { type: "png" });
}

/**
 * Validates if a language code is supported
 * @param {string} langCode - Language code to validate
 * @returns {boolean} True if language code is supported
 */
function isValidLanguage(langCode) {
  return langCode.toLowerCase() in SUPPORTED_LANGUAGES;
}

/**
 * Gets the language name from language code
 * @param {string} langCode - Language code
 * @returns {string} Language name or the code if not found
 */
function getLanguageName(langCode) {
  return SUPPORTED_LANGUAGES[langCode.toLowerCase()] || langCode.toUpperCase();
}

/**
 * Translates text using Google Translate API (free endpoint)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'en', 'ko', 'ja')
 * @param {string} [sourceLang='auto'] - Source language code or 'auto' for auto-detect
 * @returns {Promise<{translatedText: string, detectedLang: string}>} Translation result
 * @throws {Error} If translation fails
 */
async function translateText(text, targetLang, sourceLang = "auto") {
  const url = `https://translate.googleapis.com/translate_a/single`;

  const response = await axios.get(url, {
    params: {
      client: "gtx",
      sl: sourceLang,
      tl: targetLang.toLowerCase(),
      dt: "t",
      q: text,
    },
    timeout: 10000, // 10 second timeout
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const data = response.data;

  // Parse the response - Google returns an array structure
  // data[0] contains array of translation segments
  // data[2] contains detected source language
  if (!data || !Array.isArray(data) || !data[0]) {
    throw new Error("Invalid response from translation service");
  }

  // Combine all translated segments
  let translatedText = "";
  for (const segment of data[0]) {
    if (segment && segment[0]) {
      translatedText += segment[0];
    }
  }

  // Get detected source language
  const detectedLang = data[2] || sourceLang;

  return {
    translatedText,
    detectedLang,
  };
}

/**
 * Generates text-to-speech audio using Google Translate TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} lang - Language code for speech (e.g., 'en', 'ko', 'ja')
 * @returns {Promise<Buffer>} Audio buffer (MP3 format)
 * @throws {Error} If TTS generation fails
 */
async function generateTTSAudio(text, lang) {
  const url = "https://translate.google.com/translate_tts";

  const response = await axios.get(url, {
    params: {
      ie: "UTF-8",
      q: text,
      tl: lang.toLowerCase(),
      client: "tw-ob",
    },
    responseType: "arraybuffer",
    timeout: 15000, // 15 second timeout
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://translate.google.com/",
    },
  });

  if (!response.data || response.data.byteLength === 0) {
    throw new Error("Empty audio response from TTS service");
  }

  return Buffer.from(response.data);
}

/**
 * Parses translation/say command arguments
 * Supports formats:
 * - /trans <text> | <lang>
 * - /trans | <lang> (when replying to a message)
 * - /trans <text> (defaults to English)
 * @param {string} args - Command arguments
 * @returns {{text: string|null, targetLang: string}} Parsed arguments
 */
function parseTransArgs(args) {
  const defaultLang = "en";

  // Check for "| lang" pattern (pipe separator)
  const pipeMatch = args.match(/^(.*?)\s*\|\s*(\w+)\s*$/);

  if (pipeMatch) {
    const text = pipeMatch[1].trim() || null;
    const targetLang = pipeMatch[2].trim();
    return { text, targetLang };
  }

  // Default: entire args is text, translate to English
  return {
    text: args.trim() || null,
    targetLang: defaultLang,
  };
}

/**
 * Parses say command arguments
 * Supports formats:
 * - /say <text> | <lang>
 * - /say | <lang> (when replying to a message)
 * - /say <text> (defaults to English)
 * @param {string} args - Command arguments
 * @returns {{text: string|null, targetLang: string}} Parsed arguments
 */
function parseSayArgs(args) {
  const defaultLang = "en";

  // Check for "| lang" pattern (pipe separator)
  const pipeMatch = args.match(/^(.*?)\s*\|\s*(\w+)\s*$/);

  if (pipeMatch) {
    const text = pipeMatch[1].trim() || null;
    const targetLang = pipeMatch[2].trim();
    return { text, targetLang };
  }

  // Default: entire args is text, speak in English
  return {
    text: args.trim() || null,
    targetLang: defaultLang,
  };
}

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

async function main() {
  console.log("Starting bot...");

  // ============================================================
  // LOGGING MIDDLEWARE - Runs for ALL updates (including commands)
  // Must be registered BEFORE command handlers to intercept all updates
  // ============================================================
  /**
   * Universal logging middleware that logs all incoming updates.
   * Uses next() to pass control to subsequent handlers.
   * @param {object} ctx - Telegraf context object
   * @param {Function} next - Function to call next middleware
   */
  bot.use(async (ctx, next) => {
    try {
      const from = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.id ?? "unknown";
      const updateType = getUpdateType(ctx);
      const content = ctx.message?.text || ctx.callbackQuery?.data || `<${updateType}>`;

      console.log(`[${updateType.toUpperCase()}] from ${from}: ${content}`);

      // CRITICAL: Call next() to pass control to command handlers
      await next();
    } catch (error) {
      console.error("Error in logging middleware:", error);
      // Still call next() to not break the chain
      await next();
    }
  });

  // Register default commands for private chats
  await bot.telegram.setMyCommands(defaultCommands, {
    scope: { type: "all_private_chats" },
  });
  console.log(
    "Private chat commands registered:",
    defaultCommands.map((c) => c.command).join(", "),
  );

  // Register commands including setgroupname for group chats only
  await bot.telegram.setMyCommands(groupCommands, {
    scope: { type: "all_group_chats" },
  });
  console.log(
    "Group chat commands registered:",
    groupCommands.map((c) => c.command).join(", "),
  );

  // ============================================================
  // MEMBER JOIN/LEAVE HANDLERS
  // Must be registered BEFORE generic message handlers
  // ============================================================

  /**
   * Handler for new chat members joining a group
   * Sends a welcome message when users join the group
   * @param {object} ctx - Telegraf context object with new_chat_members
   */
  bot.on(message("new_chat_members"), async (ctx) => {
    try {
      const newMembers = ctx.message.new_chat_members;
      const chatTitle = ctx.chat.title || "this group";

      for (const member of newMembers) {
        // Skip if the new member is a bot (optional: you can remove this check if you want to greet bots too)
        if (member.is_bot) {
          console.log(`Bot ${member.first_name} (${member.id}) joined ${chatTitle}`);
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

        console.log(`New member: ${formatUserMention(member)} joined "${chatTitle}" (chat ${ctx.chat.id})`);
      }
    } catch (error) {
      console.error("Error in new_chat_members handler:", error);
      // Don't send error message to chat to avoid spam
    }
  });

  /**
   * Handler for chat members leaving a group
   * Sends a farewell message when users leave the group
   * @param {object} ctx - Telegraf context object with left_chat_member
   */
  bot.on(message("left_chat_member"), async (ctx) => {
    try {
      const leftMember = ctx.message.left_chat_member;
      const chatTitle = ctx.chat.title || "the group";

      // Skip if the member who left is a bot (optional: you can remove this check if you want to announce bot departures)
      if (leftMember.is_bot) {
        console.log(`Bot ${leftMember.first_name} (${leftMember.id}) left ${chatTitle}`);
        return;
      }

      const displayName = formatUserDisplayName(leftMember);
      const farewellMessage = `👋 Goodbye, ${displayName}! We hope to see you again soon.`;

      await ctx.reply(farewellMessage);

      console.log(`Member left: ${formatUserMention(leftMember)} left "${chatTitle}" (chat ${ctx.chat.id})`);
    } catch (error) {
      console.error("Error in left_chat_member handler:", error);
      // Don't send error message to chat to avoid spam
    }
  });

  // /start handler
  bot.start(async (ctx) => {
    await ctx.reply(
      `Welcome, ${ctx.from.first_name}! Use /help to see available commands.`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /help handler
  bot.help(async (ctx) => {
    // Show different commands based on chat type
    const commandsToShow = isGroupChat(ctx) ? groupCommands : defaultCommands;
    await ctx.reply(
      `List of all commands:\n${commandsToShow
        .map((cmd) => `/${cmd.command} - ${cmd.description}`)
        .join("\n")}`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /uid handler
  bot.command("uid", async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : "(no username)";
    await ctx.reply(
      `Your Telegram info:\nID: ${userId}\nName: ${firstName}\nUsername: ${username}`,
      {
        reply_to_message_id: ctx.message.message_id,
      },
    );
  });

  // /system handler - displays bot system information
  bot.command("system", async (ctx) => {
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
  });

  // /qr handler - generates QR code from provided text
  /**
   * Generates and sends a QR code image from user-provided text.
   * Usage: /qr <text to encode>
   * @param {object} ctx - Telegraf context object
   */
  bot.command("qr", async (ctx) => {
    try {
      // Get the text to encode from command arguments
      const textToEncode = getCommandArgs(ctx);

      // Validate: text must be provided
      if (!textToEncode) {
        await ctx.reply(
          "⚠️ Please provide text to generate a QR code.\nUsage: /qr <text>\nExample: /qr https://example.com",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Validate: text length (QR codes have practical limits)
      // QR Code version 40 can hold up to ~4,296 alphanumeric characters
      // Using 2000 as a reasonable limit for most use cases
      const maxLength = 2000;
      if (textToEncode.length > maxLength) {
        await ctx.reply(
          `⚠️ Text is too long. Maximum length is ${maxLength} characters.\nYour text: ${textToEncode.length} characters.`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
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
        },
      );

      console.log(
        `QR code generated for "${textToEncode.substring(0, 50)}${textToEncode.length > 50 ? "..." : ""}" by @${ctx.from.username || ctx.from.id}`,
      );
    } catch (error) {
      console.error("Error in /qr command:", error);

      // Handle specific errors
      let errorMessage = "❌ An error occurred while generating the QR code.";

      if (error.message?.includes("too long")) {
        errorMessage =
          "⚠️ The text is too long to encode in a QR code. Please use shorter text.";
      }

      await ctx.reply(errorMessage, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // /trans handler - translates text to specified language
  /**
   * Translates text using Google Translate.
   * Usage:
   *   /trans <text> | <lang>  - Translate text to specified language
   *   /trans <text>           - Translate text to English (default)
   *   /trans | <lang>         - Translate replied message to specified language
   *   /trans                  - Translate replied message to English
   * Supported languages: en, ko, ja, vi, zh, fr, de, es, ru, ar, etc.
   * @param {object} ctx - Telegraf context object
   */
  bot.command("trans", async (ctx) => {
    try {
      const args = getCommandArgs(ctx);
      const { text: parsedText, targetLang } = parseTransArgs(args);

      // Determine the text to translate
      let textToTranslate = parsedText;

      // If no text provided, check for reply message
      if (!textToTranslate && ctx.message.reply_to_message) {
        textToTranslate =
          ctx.message.reply_to_message.text ||
          ctx.message.reply_to_message.caption ||
          null;
      }

      // Validate: text must be provided
      if (!textToTranslate) {
        const usageMessage = [
          "🌐 *Translation Command Usage:*",
          "",
          "• `/trans <text> | <lang>` - Translate to specified language",
          "• `/trans <text>` - Translate to English",
          "• Reply to a message with `/trans | <lang>` - Translate replied message",
          "• Reply to a message with `/trans` - Translate to English",
          "",
          "*Examples:*",
          "• `/trans Hello world | ko`",
          "• `/trans Bonjour | ja`",
          "• `/trans こんにちは`",
          "",
          "*Common language codes:*",
          "`en` English | `ko` Korean | `ja` Japanese",
          "`zh` Chinese | `vi` Vietnamese | `th` Thai",
          "`fr` French | `de` German | `es` Spanish",
          "`ru` Russian | `ar` Arabic | `hi` Hindi",
        ].join("\n");

        await ctx.reply(usageMessage, {
          reply_to_message_id: ctx.message.message_id,
          parse_mode: "Markdown",
        });
        return;
      }

      // Validate: target language
      if (!isValidLanguage(targetLang)) {
        await ctx.reply(
          `⚠️ Unknown language code: "${targetLang}"\n\nCommon codes: en, ko, ja, zh, vi, fr, de, es, ru, ar, hi, th, fil`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Validate: text length (Google Translate has limits)
      const maxLength = 5000;
      if (textToTranslate.length > maxLength) {
        await ctx.reply(
          `⚠️ Text is too long. Maximum length is ${maxLength} characters.\nYour text: ${textToTranslate.length} characters.`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Send "translating..." indicator for longer texts
      let statusMessage = null;
      if (textToTranslate.length > 200) {
        statusMessage = await ctx.reply("🔄 Translating...", {
          reply_to_message_id: ctx.message.message_id,
        });
      }

      // Perform translation
      const { translatedText, detectedLang } = await translateText(
        textToTranslate,
        targetLang,
      );

      // Delete status message if sent
      if (statusMessage) {
        try {
          await ctx.deleteMessage(statusMessage.message_id);
        } catch {
          // Ignore deletion errors (message may already be deleted or bot lacks permission)
        }
      }

      // Format source and target language names
      const sourceLangName = getLanguageName(detectedLang);
      const targetLangName = getLanguageName(targetLang);

      // Build response message
      const responseMessage = [
        `🌐 *Translation*`,
        ``,
        `📝 ${translatedText}`,
        ``,
        `_${sourceLangName} → ${targetLangName}_`,
      ].join("\n");

      await ctx.reply(responseMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
      });

      console.log(
        `Translation: "${textToTranslate.substring(0, 30)}${textToTranslate.length > 30 ? "..." : ""}" (${detectedLang} -> ${targetLang}) by @${ctx.from.username || ctx.from.id}`,
      );
    } catch (error) {
      console.error("Error in /trans command:", error);

      // Handle specific errors
      let errorMessage = "❌ An error occurred while translating.";

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMessage =
          "⚠️ Translation request timed out. Please try again later.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "⚠️ Too many translation requests. Please wait a moment and try again.";
      } else if (error.response?.status >= 500) {
        errorMessage =
          "⚠️ Translation service is temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("Invalid response")) {
        errorMessage =
          "⚠️ Could not parse translation response. Please try again.";
      }

      await ctx.reply(errorMessage, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // /say handler - converts text to speech audio
  /**
   * Converts text to speech using Google TTS.
   * Usage:
   *   /say <text> | <lang>  - Speak text in specified language
   *   /say <text>           - Speak text in English (default)
   *   /say | <lang>         - Speak replied message in specified language
   *   /say                  - Speak replied message in English
   * Supported languages: en, ko, ja, vi, zh, fr, de, es, ru, ar, etc.
   * @param {object} ctx - Telegraf context object
   */
  bot.command("say", async (ctx) => {
    try {
      const args = getCommandArgs(ctx);
      const { text: parsedText, targetLang } = parseSayArgs(args);

      // Determine the text to speak
      let textToSpeak = parsedText;

      // If no text provided, check for reply message
      if (!textToSpeak && ctx.message.reply_to_message) {
        textToSpeak =
          ctx.message.reply_to_message.text ||
          ctx.message.reply_to_message.caption ||
          null;
      }

      // Validate: text must be provided
      if (!textToSpeak) {
        const usageMessage = [
          "🔊 *Text-to-Speech Command Usage:*",
          "",
          "• `/say <text> | <lang>` - Speak in specified language",
          "• `/say <text>` - Speak in English",
          "• Reply to a message with `/say | <lang>` - Speak replied message",
          "• Reply to a message with `/say` - Speak in English",
          "",
          "*Examples:*",
          "• `/say Hello world | en`",
          "• `/say 안녕하세요 | ko`",
          "• `/say Bonjour | fr`",
          "",
          "*Common language codes:*",
          "`en` English | `ko` Korean | `ja` Japanese",
          "`zh` Chinese | `vi` Vietnamese | `th` Thai",
          "`fr` French | `de` German | `es` Spanish",
          "`ru` Russian | `ar` Arabic | `hi` Hindi",
        ].join("\n");

        await ctx.reply(usageMessage, {
          reply_to_message_id: ctx.message.message_id,
          parse_mode: "Markdown",
        });
        return;
      }

      // Validate: target language
      if (!isValidLanguage(targetLang)) {
        await ctx.reply(
          `⚠️ Unknown language code: "${targetLang}"\n\nCommon codes: en, ko, ja, zh, vi, fr, de, es, ru, ar, hi, th, fil`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Validate: text length (Google TTS has practical limits)
      // TTS typically works best with shorter texts
      const maxLength = 200;
      if (textToSpeak.length > maxLength) {
        await ctx.reply(
          `⚠️ Text is too long for speech. Maximum length is ${maxLength} characters.\nYour text: ${textToSpeak.length} characters.\n\n💡 Tip: Try breaking your text into smaller parts.`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Send "generating..." indicator
      const statusMessage = await ctx.reply("🔄 Generating audio...", {
        reply_to_message_id: ctx.message.message_id,
      });

      // Generate TTS audio
      const audioBuffer = await generateTTSAudio(textToSpeak, targetLang);

      // Delete status message
      try {
        await ctx.deleteMessage(statusMessage.message_id);
      } catch {
        // Ignore deletion errors
      }

      // Get language name for caption
      const langName = getLanguageName(targetLang);

      // Prepare caption (truncate if text is too long for display)
      const displayText =
        textToSpeak.length > 80
          ? `${textToSpeak.substring(0, 80)}...`
          : textToSpeak;

      // Send the audio as voice message using Input.fromBuffer
      await ctx.replyWithVoice(
        Input.fromBuffer(audioBuffer, `tts_${Date.now()}.mp3`),
        {
          caption: `🔊 "${displayText}"\n_${langName}_`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message.message_id,
        },
      );

      console.log(
        `TTS generated for "${textToSpeak.substring(0, 30)}${textToSpeak.length > 30 ? "..." : ""}" (${targetLang}) by @${ctx.from.username || ctx.from.id}`,
      );
    } catch (error) {
      console.error("Error in /say command:", error);

      // Handle specific errors
      let errorMessage = "❌ An error occurred while generating speech.";

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMessage =
          "⚠️ TTS request timed out. Please try again later.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "⚠️ Too many TTS requests. Please wait a moment and try again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "⚠️ TTS service access denied. Please try again later.";
      } else if (error.response?.status >= 500) {
        errorMessage =
          "⚠️ TTS service is temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("Empty audio")) {
        errorMessage =
          "⚠️ Could not generate audio for this text. Try different text or language.";
      }

      await ctx.reply(errorMessage, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  // /setgroupname handler - changes the group name (admin only, group chats only)
  bot.command("setgroupname", async (ctx) => {
    try {
      // Validate: only works in group chats
      if (!isGroupChat(ctx)) {
        await ctx.reply(
          "⚠️ This command can only be used in group or supergroup chats.",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Get the new group name from command arguments
      const newName = getCommandArgs(ctx);

      // Validate: new name must be provided
      if (!newName) {
        await ctx.reply(
          "⚠️ Please provide a new group name.\nUsage: /setgroupname <new name>\nExample: /setgroupname My Awesome Group",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Validate: Telegram group titles must be 1-128 characters
      if (newName.length > 128) {
        await ctx.reply(
          "⚠️ Group name is too long. Maximum length is 128 characters.",
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        return;
      }

      // Attempt to change the group title
      await ctx.setChatTitle(newName);

      await ctx.reply(`✅ Group name has been changed to: "${newName}"`, {
        reply_to_message_id: ctx.message.message_id,
      });

      console.log(
        `Group name changed to "${newName}" by @${ctx.from.username || ctx.from.id} in chat ${ctx.chat.id}`,
      );
    } catch (error) {
      console.error("Error in /setgroupname command:", error);

      // Handle specific Telegram API errors
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
  });

  // NOTE: The old bot.on("message") handler has been REMOVED.
  // Logging is now handled by the bot.use() middleware above,
  // which runs for ALL updates including commands.

  // Launch bot
  await bot.launch();
  console.log("Bot is up and running...");

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => console.error(err));