# TeleBot

A modular Telegram bot built with [Telegraf](https://telegraf.js.org/) featuring commands, event handlers, and middleware support.

## ✨ Features

- **Modular Architecture** — Commands and events are separate modules, easy to add or remove
- **QR Code Generator** — Generate QR codes from any text or URL
- **Text-to-Speech** — Convert text to audio in 100+ languages
- **Translation** — Translate text between 100+ languages
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

| Command | Description | Usage |
|---------|-------------|-------|
| `/start` | Start the bot and receive a welcome message | `/start` |
| `/help` | Display list of available commands | `/help` |
| `/uid` | Get your Telegram user ID and info | `/uid` |
| `/qr` | Generate a QR code from text | `/qr https://example.com` |
| `/say` | Convert text to speech audio | `/say Hello world \| en` |
| `/trans` | Translate text to another language | `/trans Bonjour \| en` |
| `/system` | View bot system information | `/system` |

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

**Text-to-Speech:**
```
/say Hello world              → English (default)
/say 안녕하세요 | ko            → Korean
/say Bonjour | fr             → French
```
*Reply to a message with `/say | ko` to speak the replied message in Korean.*

**Translation:**
```
/trans Hello | ko             → Translate to Korean
/trans Bonjour                → Translate to English (default)
```
*Reply to a message with `/trans | ja` to translate the replied message to Japanese.*

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
│   │   ├── help.js        # /help - List commands
│   │   ├── logger.js      # Middleware - Log all updates
│   │   ├── qr.js          # /qr - QR code generator
│   │   ├── say.js         # /say - Text-to-speech
│   │   ├── setgroupname.js # /setgroupname - Rename group
│   │   ├── start.js       # /start - Welcome message
│   │   ├── system.js      # /system - Bot system info
│   │   ├── trans.js       # /trans - Translation
│   │   └── uid.js         # /uid - User ID info
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

   export const onStart = async ({ ctx, args }) => {
     await ctx.reply("🏓 Pong!", {
       reply_to_message_id: ctx.message.message_id,
     });
   };
   ```

2. Restart the bot — the command is auto-loaded!

### Command Module Structure

| Export | Type | Required | Description |
|--------|------|----------|-------------|
| `config.name` | `string` | ✅ | Command name (without `/`) |
| `config.description` | `string` | ✅ | Short description for `/help` |
| `config.permission` | `string` | ✅ | `"user"` or `"group"` |
| `onStart` | `function` | ⚠️ | Command handler (required for commands) |
| `onChat` | `function` | ⚠️ | Middleware handler (runs on every message) |

### Handler Parameters

```javascript
export const onStart = async ({ ctx, args, getCommands }) => {
  // ctx        - Telegraf context object
  // args       - Text after the command (e.g., "/cmd hello" → "hello")
  // getCommands - Function returning all loaded commands (for /help)
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

## 🔐 Security Notes

- Bot token is stored in `.env` (never commit this file)
- No sensitive data is logged or stored
- Input validation on all commands
- Rate limiting considerations for external APIs