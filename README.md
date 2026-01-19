# TeleBot

A modular Telegram bot built with [Telegraf](https://telegraf.js.org/) featuring commands, event handlers, inline keyboard buttons, and middleware support.

## ✨ Features

- **Modular Architecture** — Commands and events are separate modules, easy to add or remove
- **Inline Keyboard Buttons** — Interactive buttons on command responses
- **QR Code Generator** — Generate QR codes from any text or URL with size options
- **Text-to-Speech** — Convert text to audio in 100+ languages with quick language selection
- **Translation** — Translate text between 100+ languages with language picker
- **Group Management** — Admin commands for group settings
- **User Information** — Retrieve Telegram user IDs and info
- **Event Handling** — Welcome/farewell messages for group members
- **Logging Middleware** — All incoming updates are logged to console

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/johnlester-0369/TeleBot.git
   cd TeleBot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your bot token:

   ```
   BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
   ```

4. **Start the bot**

   ```bash
   npm start
   ```

## 🤖 Commands

### Available Everywhere (Private & Group Chats)

| Command | Description | Features |
|---------|-------------|----------|
| `/start` | Start the bot | Quick action buttons for all features |
| `/help` | Display commands | Filter by category (All/Private/Group) |
| `/uid` | Get your Telegram ID | Refresh, show chat info buttons |
| `/qr` | Generate QR code | Size selection (Small/Medium/Large) |
| `/say` | Text to speech | Language picker with 9 popular options |
| `/trans` | Translate text | Language picker with 12 popular options |
| `/system` | Bot system info | Refresh, simple/detailed view toggle |

### Group Only Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/setgroupname` | Change the group name (admin only) | `/setgroupname New Group Name` |

### Command Examples

**QR Code Generation:**
```
/qr https://telegram.org
/qr Hello, scan this QR code!
```
*Use buttons to change QR code size!*

**Text-to-Speech:**
```
/say Hello world              → Shows language picker
/say 안녕하세요 | ko            → Korean directly
/say Bonjour | fr             → French directly
```
*Use the flag buttons to quickly hear in different languages!*

**Translation:**
```
/trans Hello | ko             → Translate to Korean
/trans Bonjour                → Shows language picker
```
*Use the flag buttons to quickly translate to different languages!*

### Supported Languages

Common language codes for `/say` and `/trans`:

| Code | Language | Code | Language | Code | Language |
|------|----------|------|----------|------|----------|
| `en` | English | `ko` | Korean | `ja` | Japanese |
| `zh` | Chinese | `vi` | Vietnamese | `th` | Thai |
| `fr` | French | `de` | German | `es` | Spanish |
| `ru` | Russian | `ar` | Arabic | `hi` | Hindi |
| `fil` | Filipino | `id` | Indonesian | `pt` | Portuguese |

## 📁 Project Structure

```
TeleBot/
├── modules/
│   ├── commands/          # Bot commands
│   │   ├── help.js        # /help - List commands with filter buttons
│   │   ├── logger.js      # Middleware - Log all updates
│   │   ├── qr.js          # /qr - QR code generator with size options
│   │   ├── say.js         # /say - Text-to-speech with language picker
│   │   ├── setgroupname.js # /setgroupname - Rename group
│   │   ├── start.js       # /start - Welcome with quick action buttons
│   │   ├── system.js      # /system - Bot system info with refresh
│   │   ├── trans.js       # /trans - Translation with language picker
│   │   └── uid.js         # /uid - User ID info with chat info option
│   └── events/            # Event handlers
│       ├── join.js        # Welcome new members
│       └── leave.js       # Farewell leaving members
├── .env.example           # Environment variables template
├── index.js               # Main entry point
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Adding New Commands

1. Create a new file in `modules/commands/`:

   ```javascript
   // modules/commands/ping.js

   export const config = {
     name: "ping",
     description: "Check if bot is responsive",
     permission: "user", // "user" = everywhere, "group" = groups only
   };

   export const onStart = async ({ ctx, args, Markup }) => {
     const keyboard = Markup.inlineKeyboard([
       [Markup.button.callback("🔄 Ping Again", "ping_again")],
     ]);

     await ctx.reply("🏓 Pong!", {
       reply_to_message_id: ctx.message.message_id,
       ...keyboard,
     });
   };

   // Optional: Define callback action handlers
   export const actions = {
     ping_again: async ({ ctx }) => {
       const latency = Date.now() - ctx.callbackQuery.message.date * 1000;
       await ctx.editMessageText(`🏓 Pong! Latency: ${latency}ms`, {
         reply_markup: {
           inline_keyboard: [
             [{ text: "🔄 Ping Again", callback_data: "ping_again" }],
           ],
         },
       });
     },
   };
   ```

2. Restart the bot — the command and actions are auto-loaded!

### Command Module Structure

| Export | Type | Required | Description |
|--------|------|----------|-------------|
| `config.name` | `string` | ✅ | Command name (without `/`) |
| `config.description` | `string` | ✅ | Short description for `/help` |
| `config.permission` | `string` | ✅ | `"user"` or `"group"` |
| `onStart` | `function` | ⚠️ | Command handler (required for commands) |
| `onChat` | `function` | ⚠️ | Middleware handler (runs on every message) |
| `actions` | `object` | ❌ | Callback action handlers for inline buttons |

### Handler Parameters

```javascript
export const onStart = async ({ ctx, args, getCommands, Markup }) => {
  // ctx        - Telegraf context object
  // args       - Text after the command (e.g., "/cmd hello" → "hello")
  // getCommands - Function returning all loaded commands (for /help)
  // Markup     - Telegraf Markup utility for building keyboards
};

export const actions = {
  action_name: async ({ ctx, Markup, getCommands }) => {
    // ctx        - Telegraf callback query context
    // Markup     - Telegraf Markup utility
    // getCommands - Function returning all loaded commands
    // ctx.answerCbQuery() is called automatically after handler
  },
  
  // Supports regex patterns (wrap in slashes)
  "/pattern_(\\w+)/": async ({ ctx }) => {
    const matched = ctx.match[1]; // Access captured groups
  },
};
```

## 📡 Adding New Events

1. Create a new file in `modules/events/`:

   ```javascript
   // modules/events/photo.js

   export const config = {
     name: "photo",
     description: "Handle photo messages",
     eventType: ["photo"], // Telegraf message filter types
   };

   export const onStart = async ({ ctx }) => {
     await ctx.reply("Nice photo! 📸");
   };
   ```

2. Restart the bot — the event handler is auto-loaded!

### Supported Event Types

Common `eventType` values (from Telegraf filters):

- `text` — Text messages
- `photo` — Photos
- `video` — Videos
- `document` — Files/documents
- `sticker` — Stickers
- `voice` — Voice messages
- `audio` — Audio files
- `new_chat_members` — Users joining group
- `left_chat_member` — User leaving group

## 🛡️ Permissions

| Permission | Private Chat | Group Chat |
|------------|--------------|------------|
| `"user"` | ✅ Works | ✅ Works |
| `"group"` | ❌ Ignored | ✅ Works |

## 📝 Logging

All incoming updates are automatically logged to console by the logger middleware:

```
[COMMAND] from @username: /help
[TEXT] from @username: Hello bot!
[PHOTO] from @username: <photo>
[NEW_CHAT_MEMBERS] from @username: <new_chat_members>
```

## ⚠️ Error Handling

The bot includes comprehensive error handling:

- Invalid command arguments show usage instructions
- API failures return user-friendly error messages
- Rate limiting is handled gracefully
- All errors are logged to console
- Callback queries always receive a response

## 🔐 Security Notes

- Bot token is stored in `.env` (never commit this file)
- No sensitive data is logged or stored
- Input validation on all commands
- Rate limiting considerations for external APIs
- Callback data is validated before processing