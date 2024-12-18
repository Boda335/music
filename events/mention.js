const { prefix } = require('../config.json');
const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const delay = new Collection();
const db = require('quick.db');
const ms = require('ms');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        try {
            // تجاهل الرسائل التي تأتي من البوت أو التي تحتوي على @everyone/@here
            if (message.author.bot || message.content.includes('@everyone') || message.content.includes('@here')) {
                return;
            }

            let supp = new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/m9vNFGGC');
            const row = new ActionRowBuilder().addComponents(supp);

            if (message.mentions.has(client.user) && message.guild) {
                const guildName = message.guild.name;
                await message.reply({
                    content: `My prefix for \`${guildName}\` is ${prefix}`,
                    allowedMentions: { parse: [] },
                });
            } else if (message.mentions.has(client.user) && !message.guild) {
                await message.reply({
                    content: `You Mentioned Me in a DM! You can get help in Support Server!`,
                    allowedMentions: { parse: [] },
                    components: [row],
                });
            }
        } catch (error) {
            console.error(error);
            try {
                await message.reply({
                    content: "There was an error processing your mention!",
                });
            } catch (replyError) {
                console.error("Failed to reply:", replyError);
            }
        }
    }
}
