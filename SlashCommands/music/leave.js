const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube');
const { joinVoiceChannel } = require('@discordjs/voice');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "leave",
    description: "leave the voice channel.",
    options: [],
    async execute(client, interaction) {
        try {
            // التأكد من أن البوت متصل بقناة صوتية
            if (!interaction.guild.members.me.voice.channelId) {
                return interaction.reply({ content: ":no_entry_sign: I must be connected to a voice channel to leave.", ephemeral: true });
            }

            // التأكد من أن العضو في نفس القناة الصوتية التي يوجد فيها البوت
            if (interaction.guild.members.me.voice.channelId !== interaction.member.voice.channelId) {
                return interaction.reply({ content: `:no_entry_sign: You must be in \`${interaction.guild.members.me.voice.channel.name}\` to use that!`, ephemeral: true });
            }

            // التأكد من أن العضو متصل في قناة صوتية
            let channel = interaction.member.voice.channel;
            if (!channel) {
                return interaction.reply({ content: ":no_entry_sign: You must join a voice channel to use that!", ephemeral: true });
            }

            // ترك القناة الصوتية
            distube.voices.leave(interaction.guild);
            return interaction.reply({ content: `:white_check_mark: Successfully left \`${channel.name}\`` });
        } catch (err) {
            console.log(err);
        }
    },
};
