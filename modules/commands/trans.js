/**
 * Translation command module
 * Translates text using Google Translate API with language quick-select buttons
 */

import axios from "axios";

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
 * Popular languages for quick selection
 */
const POPULAR_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
];

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
 * @param {string} targetLang - Target language code
 * @param {string} [sourceLang='auto'] - Source language code or 'auto'
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
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const data = response.data;

  if (!data || !Array.isArray(data) || !data[0]) {
    throw new Error("Invalid response from translation service");
  }

  let translatedText = "";
  for (const segment of data[0]) {
    if (segment && segment[0]) {
      translatedText += segment[0];
    }
  }

  const detectedLang = data[2] || sourceLang;

  return {
    translatedText,
    detectedLang,
  };
}

/**
 * Parses translation command arguments
 * Supports formats:
 * - /trans <text> | <lang>
 * - /trans | <lang> (when replying)
 * - /trans <text> (defaults to English)
 * @param {string} args - Command arguments
 * @returns {{text: string|null, targetLang: string}} Parsed arguments
 */
function parseTransArgs(args) {
  const defaultLang = "en";

  const pipeMatch = args.match(/^(.*?)\s*\|\s*(\w+)\s*$/);

  if (pipeMatch) {
    const text = pipeMatch[1].trim() || null;
    const targetLang = pipeMatch[2].trim();
    return { text, targetLang };
  }

  return {
    text: args.trim() || null,
    targetLang: defaultLang,
  };
}

/**
 * Builds language selection keyboard
 * @param {string} textToTranslate - Text to be translated (for callback data)
 * @returns {object} Inline keyboard markup
 */
function buildLanguageKeyboard(textToTranslate) {
  // Store text in first 50 chars for callback (Telegram limits callback_data to 64 bytes)
  const textPreview = textToTranslate.substring(0, 30);
  const rows = [];

  // Split popular languages into rows of 3
  for (let i = 0; i < POPULAR_LANGUAGES.length; i += 3) {
    const row = POPULAR_LANGUAGES.slice(i, i + 3).map((lang) => ({
      text: `${lang.flag} ${lang.code.toUpperCase()}`,
      callback_data: `trans_${lang.code}`,
    }));
    rows.push(row);
  }

  return { inline_keyboard: rows };
}

export const config = {
  name: "trans",
  description: "Translate text to another language",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /trans command
 * Translates text using Google Translate.
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {string} params.args - Command arguments
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, args, Markup }) => {
  try {
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
        "🌐 *Translation Command*",
        "",
        "*Usage:*",
        "• `/trans <text> | <lang>` - Translate to specified language",
        "• `/trans <text>` - Translate to English",
        "• Reply to a message with `/trans | <lang>`",
        "",
        "*Examples:*",
        "• `/trans Hello world | ko`",
        "• `/trans Bonjour | ja`",
        "",
        "*Quick translate:* Type your text and select a language below!",
      ].join("\n");

      await ctx.reply(usageMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
      });
      return;
    }

    // Store text for quick language selection buttons
    // If no target lang specified, show language picker
    if (args && !args.includes("|")) {
      const selectMessage = [
        `🌐 *Select Target Language*`,
        ``,
        `📝 Text: "${textToTranslate.length > 50 ? textToTranslate.substring(0, 50) + "..." : textToTranslate}"`,
        ``,
        `_Choose a language to translate to:_`,
      ].join("\n");

      // Store the text in session or use inline approach
      // For simplicity, we'll perform the translation when button is clicked
      // by using the reply message
      await ctx.reply(selectMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
        reply_markup: buildLanguageKeyboard(textToTranslate),
      });
      return;
    }

    // Validate: target language
    if (!isValidLanguage(targetLang)) {
      await ctx.reply(
        `⚠️ Unknown language code: "${targetLang}"\n\nCommon codes: en, ko, ja, zh, vi, fr, de, es, ru, ar, hi, th, fil`,
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
      return;
    }

    // Validate: text length
    const maxLength = 5000;
    if (textToTranslate.length > maxLength) {
      await ctx.reply(
        `⚠️ Text is too long. Maximum length is ${maxLength} characters.\nYour text: ${textToTranslate.length} characters.`,
        {
          reply_to_message_id: ctx.message.message_id,
        }
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
      targetLang
    );

    // Delete status message if sent
    if (statusMessage) {
      try {
        await ctx.deleteMessage(statusMessage.message_id);
      } catch {
        // Ignore deletion errors
      }
    }

    // Format response
    const sourceLangName = getLanguageName(detectedLang);
    const targetLangName = getLanguageName(targetLang);

    const responseMessage = [
      `🌐 *Translation*`,
      ``,
      `📝 ${translatedText}`,
      ``,
      `_${sourceLangName} → ${targetLangName}_`,
    ].join("\n");

    // Add translate to another language buttons
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🇬🇧 EN", `trans_quick_en`),
        Markup.button.callback("🇰🇷 KO", `trans_quick_ko`),
        Markup.button.callback("🇯🇵 JA", `trans_quick_ja`),
        Markup.button.callback("🇨🇳 ZH", `trans_quick_zh`),
      ],
    ]);

    await ctx.reply(responseMessage, {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "Markdown",
      ...keyboard,
    });

    console.log(
      `Translation: "${textToTranslate.substring(0, 30)}${textToTranslate.length > 30 ? "..." : ""}" (${detectedLang} -> ${targetLang}) by @${ctx.from.username || ctx.from.id}`
    );
  } catch (error) {
    console.error("Error in /trans command:", error);

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
};

/**
 * Callback action handlers for translation language buttons
 */
export const actions = {
  // Handle language selection from picker
  "/trans_(en|ko|ja|zh|es|fr|de|ru|ar|hi|pt|vi)/": async ({ ctx }) => {
    const targetLang = ctx.match[1];
    
    // Get the original message that triggered this
    const originalMessage = ctx.callbackQuery.message.reply_to_message;
    if (!originalMessage?.text) {
      await ctx.editMessageText("⚠️ Could not find the original text to translate. Please use the command again.");
      return;
    }

    // Extract text from original command
    const commandMatch = originalMessage.text.match(/^\/trans\s+(.+)$/);
    const textToTranslate = commandMatch ? commandMatch[1].trim() : null;

    if (!textToTranslate) {
      await ctx.editMessageText("⚠️ Could not extract text to translate. Please use `/trans <text> | <lang>` format.", {
        parse_mode: "Markdown",
      });
      return;
    }

    try {
      await ctx.editMessageText("🔄 Translating...");

      const { translatedText, detectedLang } = await translateText(textToTranslate, targetLang);
      const sourceLangName = getLanguageName(detectedLang);
      const targetLangName = getLanguageName(targetLang);

      const responseMessage = [
        `🌐 *Translation*`,
        ``,
        `📝 ${translatedText}`,
        ``,
        `_${sourceLangName} → ${targetLangName}_`,
      ].join("\n");

      await ctx.editMessageText(responseMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🇬🇧 EN", callback_data: "trans_en" },
              { text: "🇰🇷 KO", callback_data: "trans_ko" },
              { text: "🇯🇵 JA", callback_data: "trans_ja" },
              { text: "🇨🇳 ZH", callback_data: "trans_zh" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Translation error:", error);
      await ctx.editMessageText("❌ Translation failed. Please try again.");
    }
  },

  // Quick translate buttons on result message
  "/trans_quick_(en|ko|ja|zh)/": async ({ ctx }) => {
    const targetLang = ctx.match[1];
    const messageText = ctx.callbackQuery.message.text;

    // Extract the translated text from the previous result
    const textMatch = messageText.match(/📝 (.+?)(?:\n|$)/);
    if (!textMatch) {
      await ctx.answerCbQuery("Could not find text to translate");
      return;
    }

    const textToTranslate = textMatch[1].trim();

    try {
      const { translatedText, detectedLang } = await translateText(textToTranslate, targetLang);
      const sourceLangName = getLanguageName(detectedLang);
      const targetLangName = getLanguageName(targetLang);

      const responseMessage = [
        `🌐 *Translation*`,
        ``,
        `📝 ${translatedText}`,
        ``,
        `_${sourceLangName} → ${targetLangName}_`,
      ].join("\n");

      await ctx.editMessageText(responseMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🇬🇧 EN", callback_data: "trans_quick_en" },
              { text: "🇰🇷 KO", callback_data: "trans_quick_ko" },
              { text: "🇯🇵 JA", callback_data: "trans_quick_ja" },
              { text: "🇨🇳 ZH", callback_data: "trans_quick_zh" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Quick translation error:", error);
      await ctx.answerCbQuery("Translation failed");
    }
  },
};