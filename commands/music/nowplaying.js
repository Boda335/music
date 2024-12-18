const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube');
const { Utils } = require("devtools-ts");
const utilites = new Utils();
const config = require('../../config.json');
module.exports = {
    name: "nowplaying",
    description: "Shows what is song that the bot is currently playing.",
    cooldown: 5000,
    aliases: ['np', 'status', 'song','songinfo','playing'],
    async execute(client, message, args) {
        try {
            if (message.guild.members.me.voice?.channelId && message.member.voice.channelId !== message.guild.members.me?.voice?.channelId) 
                return message.reply({ content: `:no_entry_sign: You must be listening in \`${message.guild.members.me?.voice?.channel.name}\` to use that!` });
            
            if (!message.member.voice.channel)
                return message.reply({ content: ":no_entry_sign: You must join a voice channel to use that!" });
            
            const queue = distube.getQueue(message);
            if (!queue) return message.reply({ content: `:no_entry_sign: There must be music playing to use that!` });

            const song = queue.songs[0];

            // حساب نسبة التقدم
            const progress = Math.floor((queue.currentTime / song.duration) * 100); // نسبة من 0 إلى 100
            const progressBar = `**[ ${progress}% ]**`;

            let embed = new EmbedBuilder()
                .setColor(config.MainEmbedColor) 
                .setTitle(`${song.name}`)
                .setURL(`${song.url}`)
                .setDescription(
                    `🎵 **Currently Playing:**\n\n` +
                    `🕒 **Progress:** \`[${queue.formattedCurrentTime} / ${song.formattedDuration}]\` ${progressBar}`
                )
                .setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
                .setFooter({
                    text: `Uploaded by ${song.uploader.name} • Views: ${song.views} • Likes: ${song.likes}`,
                });

            message.reply({ embeds: [embed] });
        } catch (err) {
            console.log(err);
        }
    },
};
