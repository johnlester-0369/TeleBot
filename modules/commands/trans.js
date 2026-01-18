/**
 * Translation command module
 * Translates text using Google Translate API
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
 */
export const onStart = async ({ ctx, args }) => {
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

    await ctx.reply(responseMessage, {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "Markdown",
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