/**
 * Help command module
 * Displays available commands based on chat type with filter buttons
 */

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
 * Formats command list based on filter
 * @param {Array} commands - All loaded commands
 * @param {string} filter - Filter type: 'all', 'user', 'group'
 * @param {boolean} isGroup - Whether current chat is a group
 * @returns {string} Formatted command list
 */
function formatCommandList(commands, filter, isGroup) {
  let filtered = commands;

  if (filter === "user") {
    filtered = commands.filter((cmd) => cmd.permission === "user");
  } else if (filter === "group") {
    filtered = commands.filter((cmd) => cmd.permission === "group");
  } else {
    // 'all' - but still respect visibility rules
    filtered = commands.filter((cmd) => {
      if (cmd.permission === "group") return isGroup;
      return true;
    });
  }

  if (filtered.length === 0) {
    return "_No commands available for this filter._";
  }

  return filtered.map((cmd) => {
    const icon = cmd.permission === "group" ? "👥" : "👤";
    return `${icon} /${cmd.name} - ${cmd.description}`;
  }).join("\n");
}

export const config = {
  name: "help",
  description: "How to use the bot",
  permission: "user", // Available in private chat and group
};

/**
 * Handler for /help command
 * @param {object} params - Command parameters
 * @param {object} params.ctx - Telegraf context object
 * @param {Function} params.getCommands - Function to get all loaded commands
 * @param {object} params.Markup - Telegraf Markup utility
 */
export const onStart = async ({ ctx, getCommands, Markup }) => {
  const allCommands = getCommands();
  const isGroup = isGroupChat(ctx);

  const commandList = formatCommandList(allCommands, "all", isGroup);

  const helpMessage = [
    `📚 *Bot Commands*`,
    ``,
    commandList,
    ``,
    `_Use buttons below to filter commands:_`,
  ].join("\n");

  // Build keyboard based on chat type
  const keyboardRows = [
    [
      Markup.button.callback("📋 All", "help_all"),
      Markup.button.callback("👤 Private", "help_user"),
    ],
  ];

  // Only show group filter in groups
  if (isGroup) {
    keyboardRows[0].push(Markup.button.callback("👥 Group", "help_group"));
  }

  const keyboard = Markup.inlineKeyboard(keyboardRows);

  await ctx.reply(helpMessage, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "Markdown",
    ...keyboard,
  });
};

/**
 * Callback action handlers for help command buttons
 */
export const actions = {
  help_all: async ({ ctx, getCommands }) => {
    const allCommands = getCommands();
    const isGroup = isGroupChat(ctx);
    const commandList = formatCommandList(allCommands, "all", isGroup);

    const helpMessage = [
      `📚 *All Commands*`,
      ``,
      commandList,
      ``,
      `_Filter:_ 📋 All`,
    ].join("\n");

    const keyboardRows = [
      [
        { text: "📋 All ✓", callback_data: "help_all" },
        { text: "👤 Private", callback_data: "help_user" },
      ],
    ];

    if (isGroup) {
      keyboardRows[0].push({ text: "👥 Group", callback_data: "help_group" });
    }

    await ctx.editMessageText(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboardRows },
    });
  },

  help_user: async ({ ctx, getCommands }) => {
    const allCommands = getCommands();
    const isGroup = isGroupChat(ctx);
    const commandList = formatCommandList(allCommands, "user", isGroup);

    const helpMessage = [
      `📚 *Private Chat Commands*`,
      ``,
      commandList,
      ``,
      `_Filter:_ 👤 Private`,
    ].join("\n");

    const keyboardRows = [
      [
        { text: "📋 All", callback_data: "help_all" },
        { text: "👤 Private ✓", callback_data: "help_user" },
      ],
    ];

    if (isGroup) {
      keyboardRows[0].push({ text: "👥 Group", callback_data: "help_group" });
    }

    await ctx.editMessageText(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboardRows },
    });
  },

  help_group: async ({ ctx, getCommands }) => {
    const allCommands = getCommands();
    const isGroup = isGroupChat(ctx);
    const commandList = formatCommandList(allCommands, "group", isGroup);

    const helpMessage = [
      `📚 *Group Commands*`,
      ``,
      commandList,
      ``,
      `_Filter:_ 👥 Group`,
    ].join("\n");

    await ctx.editMessageText(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📋 All", callback_data: "help_all" },
            { text: "👤 Private", callback_data: "help_user" },
            { text: "👥 Group ✓", callback_data: "help_group" },
          ],
        ],
      },
    });
  },
};