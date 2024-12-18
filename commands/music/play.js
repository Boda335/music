const { ApplicationCommandOptionType } = require("discord.js");
const distube = require('../../client/distube');
const wait = require('node:timers/promises').setTimeout;
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "play",
    description: "Add a song to queue and plays it.",
    cooldown: 5000,
    aliases: ['p'],
    async execute(client, message, args) {
        const input = args.join(" ");  // دمج جميع العناصر في args لتشكيل الإدخال
        const isPlaylist = input.toLowerCase() === "playlist";  // التحقق إذا كانت كلمة "playlist"

        try {
            if (isPlaylist) {
                // التعامل مع "playlist"
                const userId = message.author.id;
                const filePath = path.join(__dirname, '../../Database/database.json');
                
                let favorites = {};
                if (fs.existsSync(filePath)) {
                    favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                
                if (!favorites[userId] || favorites[userId].length === 0) {
                    return message.reply({ content: ":no_entry_sign: You don't have any favorites to play!", ephemeral: true });
                }
                
                const voiceChannel = message.member?.voice?.channel;
                if (!voiceChannel) return message.reply({ content: ":no_entry_sign: You must join a voice channel to play your playlist!", ephemeral: true });

                const replyMessage = await message.reply({ content: `:watch: Playing your playlist...` });

                const firstSong = favorites[userId][0];
                distube.play(voiceChannel, firstSong.songurl, {
                    message,
                    textChannel: message.channel,
                    member: message.member,
                });
                
                await wait(5000);  // الانتظار 5 ثواني قبل إضافة باقي الأغاني
                for (let i = 1; i < favorites[userId].length; i++) {
                    const song = favorites[userId][i];
                    distube.play(voiceChannel, song.songurl, {
                        message,
                        textChannel: message.channel,
                        member: message.member,
                    });
                }

                await replyMessage.delete();  // حذف الرد
            } else if (input) {
                // التعامل مع الأغنية العادية
                const songTitle = input;
                if (message.guild.members.me.voice?.channelId && message.member.voice.channelId !== message.guild.members.me?.voice?.channelId) {
                    return message.reply({ content: `:no_entry_sign: You must be listening in \`${message.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
                }
                if (!message.member.voice.channel)
                    return message.reply({ content: ":no_entry_sign: You must join a voice channel to use that!", ephemeral: true });
                if (!songTitle) return message.reply({ content: `:no_entry_sign: You should type song name or url.`, ephemeral: true });

                const replyMessage = await message.reply({ content: `:watch: Searching ... (\`${songTitle}\`)` });
                await wait(3000);
                await replyMessage.delete();  // حذف الرد بعد الانتظار

                const voiceChannel = message.member?.voice?.channel;
                if (voiceChannel) {
                    distube.play(voiceChannel, songTitle, {
                        message,
                        textChannel: message.channel,
                        member: message.member,
                    });
                }
            } else {
                return message.reply({ content: ":no_entry_sign: You must provide a song or playlist to play!" });
            }
        } catch (err) {
            console.log(err);
        }
    },
};
