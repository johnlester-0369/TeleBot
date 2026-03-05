# TeleBot

> A modular Telegram bot built with [Telegraf](https://telegraf.js.org/) — add a command file, restart, done.

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

Most Telegram bots grow into a single, unmaintainable file. TeleBot solves this by auto-loading commands and events as isolated modules — no registration boilerplate, no core edits required when you extend it.

## Architecture

```
    ┌────────────────┐
    │    Telegram    │
    │     Users      │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  Telegram API  │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │    TeleBot     │
    │   (index.js)   │
    └────────────────┘
```

`index.js` reads `modules/commands/` and `modules/events/` at startup, registers every valid module with Telegraf, and wires inline keyboard actions automatically. External APIs are called on-demand by individual command modules.

## Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

## Quick Start

```bash
git clone https://github.com/johnlester-0369/TeleBot.git
cd TeleBot
npm install
cp .env.example .env
```

Edit `.env` and set your token:

```
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
```

```bash
npm start
```

Open Telegram, message your bot, and type `/start`.

## Commands

### Available Everywhere (Private & Group Chats)

| Command | Description | Features |
|---------|-------------|----------|
| `/start` | Start the bot | Quick action buttons for all features |
| `/help` | Display commands | Filter by category (All / Private / Group) |
| `/uid` | Get your Telegram ID | Refresh, show chat info buttons |
| `/qr` | Generate QR code | Size selection (Small / Medium / Large) |
| `/say` | Text to speech | Language picker with 9 popular options |
| `/trans` | Translate text | Language picker with 12 popular options |
| `/system` | Bot system info | Refresh, simple / detailed view toggle |

### Group Only

| Command | Description | Usage |
|---------|-------------|-------|
| `/setgroupname` | Change the group name (admin only) | `/setgroupname New Group Name` |

### Examples

**QR Code:**
```
/qr https://telegram.org
/qr Hello, scan this QR code!
```
Use the size buttons to regenerate at Small / Medium / Large.

**Text-to-Speech:**
```
/say Hello world              → shows language picker
/say 안녕하세요 | ko            → Korean directly
/say Bonjour | fr             → French directly
```

**Translation:**
```
/trans Hello | ko             → translate to Korean
/trans Bonjour                → shows language picker
```

### Supported Languages

| Code | Language | Code | Language | Code | Language |
|------|----------|------|----------|------|----------|
| `en` | English | `ko` | Korean | `ja` | Japanese |
| `zh` | Chinese | `vi` | Vietnamese | `th` | Thai |
| `fr` | French | `de` | German | `es` | Spanish |
| `ru` | Russian | `ar` | Arabic | `hi` | Hindi |
| `fil` | Filipino | `id` | Indonesian | `pt` | Portuguese |

## Project Structure

```
TeleBot/
├── modules/
│   ├── commands/           # Bot commands (auto-loaded at startup)
│   │   ├── help.js         # /help — list commands with filter buttons
│   │   ├── logger.js       # Middleware — log all updates
│   │   ├── qr.js           # /qr — QR code generator with size options
│   │   ├── say.js          # /say — text-to-speech with language picker
│   │   ├── setgroupname.js # /setgroupname — rename group (admin only)
│   │   ├── start.js        # /start — welcome with quick action buttons
│   │   ├── system.js       # /system — bot system info with refresh
│   │   ├── trans.js        # /trans — translation with language picker
│   │   └── uid.js          # /uid — user ID info with chat info option
│   └── events/             # Event handlers (auto-loaded at startup)
│       ├── join.js         # Welcome new members
│       └── leave.js        # Farewell leaving members
├── .env.example            # Environment variables template
├── index.js                # Entry point — loads and wires all modules
├── package.json            # Dependencies and scripts
└── README.md
```

## Adding Commands

1. Create a file in `modules/commands/`:

```javascript
// modules/commands/ping.js

export const config = {
  name: "ping",
  description: "Check if bot is responsive",
  permission: "user",   // "user" = everywhere, "group" = groups only
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

// Optional: define callback action handlers for inline buttons
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

2. Restart the bot — the command and its actions are auto-loaded.

### Module Export Contract

| Export | Type | Required | Description |
|--------|------|----------|-------------|
| `config.name` | `string` | ✅ | Command name (without `/`) |
| `config.description` | `string` | ✅ | Short description shown in `/help` |
| `config.permission` | `string` | ✅ | `"user"` or `"group"` |
| `onStart` | `function` | ⚠️ | Command handler (required for commands) |
| `onChat` | `function` | ⚠️ | Middleware handler — runs on every message |
| `actions` | `object` | ❌ | Callback handlers for inline buttons |

### Handler Parameters

```javascript
export const onStart = async ({ ctx, args, getCommands, Markup }) => {
  // ctx         — Telegraf context object
  // args        — text after the command ("/cmd hello" → "hello")
  // getCommands — returns all loaded command configs (used by /help)
  // Markup      — Telegraf Markup utility for building keyboards
};

export const actions = {
  action_name: async ({ ctx, Markup, getCommands }) => {
    // ctx.answerCbQuery() is called automatically after this handler
  },

  // Regex patterns are supported — wrap in forward slashes
  "/pattern_(\\w+)/": async ({ ctx }) => {
    const matched = ctx.match[1]; // access captured groups
  },
};
```

## Adding Events

1. Create a file in `modules/events/`:

```javascript
// modules/events/photo.js

export const config = {
  name: "photo",
  description: "Handle photo messages",
  eventType: ["photo"],   // Telegraf message filter types
};

export const onStart = async ({ ctx }) => {
  await ctx.reply("Nice photo! 📸");
};
```

2. Restart the bot — the event handler is auto-loaded.

### Supported Event Types

`text` · `photo` · `video` · `document` · `sticker` · `voice` · `audio` · `new_chat_members` · `left_chat_member`

## Permissions

| Permission | Private Chat | Group Chat |
|------------|--------------|------------|
| `"user"` | ✅ Works | ✅ Works |
| `"group"` | ❌ Ignored | ✅ Works |

## Logging

All incoming updates are logged automatically by the logger middleware:

```
[COMMAND] from @username: /help
[TEXT] from @username: Hello bot!
[PHOTO] from @username: <photo>
[NEW_CHAT_MEMBERS] from @username: <new_chat_members>
```

## Error Handling

- Invalid command arguments show usage instructions
- API failures return user-friendly error messages
- All errors are logged to console
- Callback queries always receive a response

## Security

- Bot token is stored in `.env` — never commit this file
- No sensitive data is logged or stored
- Input validation on all commands
- Callback data is validated before processing