/**
 * Say command module
 * Converts text to speech using Google TTS with language quick-select buttons
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
 * Popular languages for quick TTS selection
 */
const POPULAR_TTS_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
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

/**
 * Builds language selection keyboard for TTS
 * @returns {object} Inline keyboard markup
 */
function buildTTSLanguageKeyboard() {
  const rows = [];

  // Split popular languages into rows of 3
  for (let i = 0; i < POPULAR_TTS_LANGUAGES.length; i += 3) {
    const row = POPULAR_TTS_LANGUAGES.slice(i, i + 3).map((lang) => ({
      text: `${lang.flag} ${lang.code.toUpperCase()}`,
      callback_data: `say_${lang.code}`,
    }));
    rows.push(row);
  }

  return { inline_keyboard: rows };
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
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, args, Markup }) => {
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

    // Validate: text must be provided - show usage with language picker
    if (!textToSpeak) {
      const usageMessage = [
        "🔊 *Text-to-Speech Command*",
        "",
        "*Usage:*",
        "• `/say <text> | <lang>` - Speak in specified language",
        "• `/say <text>` - Speak in English",
        "• Reply to a message with `/say | <lang>`",
        "",
        "*Examples:*",
        "• `/say Hello world | en`",
        "• `/say 안녕하세요 | ko`",
        "",
        "*Note:* Max 200 characters per request.",
      ].join("\n");

      await ctx.reply(usageMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
      });
      return;
    }

    // If text provided without language, show language picker
    if (args && !args.includes("|")) {
      const selectMessage = [
        `🔊 *Select Voice Language*`,
        ``,
        `📝 Text: "${textToSpeak.length > 50 ? textToSpeak.substring(0, 50) + "..." : textToSpeak}"`,
        ``,
        `_Choose a language for the voice:_`,
      ].join("\n");

      await ctx.reply(selectMessage, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown",
        reply_markup: buildTTSLanguageKeyboard(),
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

    // Build quick language buttons for re-speaking
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🇬🇧", `say_quick_en`),
        Markup.button.callback("🇰🇷", `say_quick_ko`),
        Markup.button.callback("🇯🇵", `say_quick_ja`),
        Markup.button.callback("🇨🇳", `say_quick_zh`),
        Markup.button.callback("🇫🇷", `say_quick_fr`),
        Markup.button.callback("🇪🇸", `say_quick_es`),
      ],
    ]);

    // Send the audio as voice message
    await ctx.replyWithVoice(
      Input.fromBuffer(audioBuffer, `tts_${Date.now()}.mp3`),
      {
        caption: `🔊 "${displayText}"\n_${langName}_`,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
        ...keyboard,
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

/**
 * Callback action handlers for TTS language buttons
 */
export const actions = {
  // Handle language selection from picker
  "/say_(en|ko|ja|zh|es|fr|de|ru|pt)/": async ({ ctx }) => {
    const targetLang = ctx.match[1];
    
    // Get the original message that triggered this
    const originalMessage = ctx.callbackQuery.message.reply_to_message;
    if (!originalMessage?.text) {
      await ctx.editMessageText("⚠️ Could not find the original text. Please use the command again.");
      return;
    }

    // Extract text from original command
    const commandMatch = originalMessage.text.match(/^\/say\s+(.+)$/);
    const textToSpeak = commandMatch ? commandMatch[1].trim() : null;

    if (!textToSpeak) {
      await ctx.editMessageText("⚠️ Could not extract text. Please use `/say <text> | <lang>` format.", {
        parse_mode: "Markdown",
      });
      return;
    }

    // Validate length
    if (textToSpeak.length > 200) {
      await ctx.editMessageText("⚠️ Text is too long (max 200 characters).");
      return;
    }

    try {
      await ctx.editMessageText("🔄 Generating audio...");

      const audioBuffer = await generateTTSAudio(textToSpeak, targetLang);
      const langName = getLanguageName(targetLang);
      const displayText = textToSpeak.length > 80 ? `${textToSpeak.substring(0, 80)}...` : textToSpeak;

      // Delete the "generating" message and send voice
      try {
        await ctx.deleteMessage();
      } catch {
        // Ignore
      }

      await ctx.replyWithVoice(
        Input.fromBuffer(audioBuffer, `tts_${Date.now()}.mp3`),
        {
          caption: `🔊 "${displayText}"\n_${langName}_`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🇬🇧", callback_data: "say_quick_en" },
                { text: "🇰🇷", callback_data: "say_quick_ko" },
                { text: "🇯🇵", callback_data: "say_quick_ja" },
                { text: "🇨🇳", callback_data: "say_quick_zh" },
                { text: "🇫🇷", callback_data: "say_quick_fr" },
                { text: "🇪🇸", callback_data: "say_quick_es" },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("TTS generation error:", error);
      await ctx.editMessageText("❌ Failed to generate audio. Please try again.");
    }
  },

  // Quick TTS buttons on voice message (re-speak in different language)
  "/say_quick_(en|ko|ja|zh|fr|es)/": async ({ ctx }) => {
    const targetLang = ctx.match[1];
    const caption = ctx.callbackQuery.message.caption;

    // Extract the text from the caption
    const textMatch = caption?.match(/🔊 "(.+?)"/);
    if (!textMatch) {
      await ctx.answerCbQuery("Could not find text to speak");
      return;
    }

    let textToSpeak = textMatch[1].trim();
    // Remove trailing ... if present
    if (textToSpeak.endsWith("...")) {
      textToSpeak = textToSpeak.slice(0, -3);
    }

    try {
      await ctx.answerCbQuery("Generating audio...");

      const audioBuffer = await generateTTSAudio(textToSpeak, targetLang);
      const langName = getLanguageName(targetLang);
      const displayText = textToSpeak.length > 80 ? `${textToSpeak.substring(0, 80)}...` : textToSpeak;

      await ctx.replyWithVoice(
        Input.fromBuffer(audioBuffer, `tts_${Date.now()}.mp3`),
        {
          caption: `🔊 "${displayText}"\n_${langName}_`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🇬🇧", callback_data: "say_quick_en" },
                { text: "🇰🇷", callback_data: "say_quick_ko" },
                { text: "🇯🇵", callback_data: "say_quick_ja" },
                { text: "🇨🇳", callback_data: "say_quick_zh" },
                { text: "🇫🇷", callback_data: "say_quick_fr" },
                { text: "🇪🇸", callback_data: "say_quick_es" },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Quick TTS error:", error);
      await ctx.answerCbQuery("TTS generation failed");
    }
  },
};