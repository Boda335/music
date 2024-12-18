const { REST } = require("@discordjs/rest");
const fs = require('fs');
const { Routes } = require("discord-api-types/v9");
const os = require("os");
const {
  Client,
  Collection,
  Partials,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const config = require("./config.json");
const { createLogger, transports, format } = require("winston");
const path = require("path");
const logger = createLogger({
  level: "error",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({
      filename: path.join(__dirname, "Logs", "Errors.json"),
    }),
  ],
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    //GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember,
  ],
  shards: "auto",
  allowedMentions: {
    parse: [],
    repliedUser: false,
  },
});

client.setMaxListeners(25);
require("events").defaultMaxListeners = 25;

client.on("error", (error) => {
  console.error("Discord.js error:", error);
  logger.error("Discord.js error:", error);
});

client.on("warn", (warning) => {
  console.warn("Discord.js warning:", warning);
});

let antiCrashLogged = false;

process.on("unhandledRejection", (reason, p) => {
  if (!antiCrashLogged) {
    console.error("[antiCrash] :: Unhandled Rejection/Catch");
    console.error(reason, p);
    logger.error("[antiCrash] :: Unhandled Rejection/Catch", { reason, p });
    antiCrashLogged = true;
  }
});

process.on("uncaughtException", (err, origin) => {
  if (!antiCrashLogged) {
    console.error("[antiCrash] :: Uncaught Exception/Catch");
    console.error(err, origin);
    logger.error("[antiCrash] :: Uncaught Exception/Catch", { err, origin });
    antiCrashLogged = true;
  }
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  if (!antiCrashLogged) {
    console.error("[antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    console.error(err, origin);
    logger.error("[antiCrash] :: Uncaught Exception/Catch (MONITOR)", {
      err,
      origin,
    });
    antiCrashLogged = true;
  }
});
process.on('warning', (warning) => {
  // تجاهل التحذيرات أو التعامل معها بطريقة معينة
  if (warning.message.includes("Could not parse n transform function")) {
      return;
  }
  console.warn(warning);  // اطبع التحذيرات الأخرى فقط
});


module.exports = client;
client.commands = new Collection();
client.events = new Collection();
client.slashCommands = new Collection();
["commands", "events", "slash",].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

const commands = client.slashCommands.map(({ execute, ...data }) => data);
client
  .login(config.token || process.env.token)
  .then((bot) => {
    const rest = new REST({ version: "9" }).setToken(
      config.token || process.env.token
    );
    rest
      .put(Routes.applicationCommands(config.clientID), { body: commands })
      .then(() =>
        console.log("Successfully registered application commands globally.")
      )
      .catch(console.error);
  })
