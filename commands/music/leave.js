const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube');
const { joinVoiceChannel } = require('@discordjs/voice');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "leave",
    description: "leave the voice channel.",
    cooldown: 5000,
    aliases: ['disconnect', 'dc'],
    async execute(client, message, args) {
        try {
            // التأكد من أن البوت متصل بقناة صوتية
            if (!message.guild.members.me.voice.channelId) {
                return message.reply({ content: ":no_entry_sign: I must be connected to a voice channel to leave." });
            }

            // التأكد من أن العضو في نفس القناة الصوتية التي يوجد فيها البوت
            if (message.guild.members.me.voice.channelId !== message.member.voice.channelId) {
                return message.reply({ content: `:no_entry_sign: You must be in \`${message.guild.members.me.voice.channel.name}\` to use that!` });
            }

            // التأكد من أن العضو في قناة صوتية
            let channel = message.member.voice.channel;
            if (!channel) {
                return message.reply({ content: ":no_entry_sign: You must join a voice channel to use that!" });
            }

            // ترك القناة الصوتية
            distube.voices.leave(message.guild);
            return message.reply({ content: `:white_check_mark: Successfully left \`${channel.name}\`` });
        } catch (err) {
            console.log(err);
        }
    },
};
