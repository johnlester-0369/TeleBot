/**
 * Say command module
 * Converts text to speech using Google TTS
 */

import axios from "axios";
import { Input } from "telegraf";

/**
 * Supported language codes for TTS
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
 * Generates text-to-speech audio using Google Translate TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} lang - Language code for speech
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
    timeout: 15000,
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
 * Parses say command arguments
 * @param {string} args - Command arguments
 * @returns {{text: string|null, targetLang: string}} Parsed arguments
 */
function parseSayArgs(args) {
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
  name: "say",
  description: "Convert text to speech audio",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /say command
 * Converts text to speech using Google TTS.
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {string} params.args - Command arguments
 */
export const onStart = async ({ ctx, args }) => {
  try {
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
        }
      );
      return;
    }

    // Validate: text length
    const maxLength = 200;
    if (textToSpeak.length > maxLength) {
      await ctx.reply(
        `⚠️ Text is too long for speech. Maximum length is ${maxLength} characters.\nYour text: ${textToSpeak.length} characters.\n\n💡 Tip: Try breaking your text into smaller parts.`,
        {
          reply_to_message_id: ctx.message.message_id,
        }
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

    // Prepare caption
    const displayText =
      textToSpeak.length > 80
        ? `${textToSpeak.substring(0, 80)}...`
        : textToSpeak;

    // Send the audio as voice message
    await ctx.replyWithVoice(
      Input.fromBuffer(audioBuffer, `tts_${Date.now()}.mp3`),
      {
        caption: `🔊 "${displayText}"\n_${langName}_`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );

    console.log(
      `TTS generated for "${textToSpeak.substring(0, 30)}${textToSpeak.length > 30 ? "..." : ""}" (${targetLang}) by @${ctx.from.username || ctx.from.id}`
    );
  } catch (error) {
    console.error("Error in /say command:", error);

    let errorMessage = "❌ An error occurred while generating speech.";

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      errorMessage = "⚠️ TTS request timed out. Please try again later.";
    } else if (error.response?.status === 429) {
      errorMessage =
        "⚠️ Too many TTS requests. Please wait a moment and try again.";
    } else if (error.response?.status === 403) {
      errorMessage = "⚠️ TTS service access denied. Please try again later.";
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
};