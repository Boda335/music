const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube');
const lyricsFinder = require('lyrics-finder');
const config = require('../../config.json');

module.exports = {
    name: "lyrics",
    description: "Search for the lyrics of the current playing song.",
    cooldown: 5000,
    aliases: ['ly', 'lyric'],
    async execute(client, message, args) {
        try {
            // التأكد من وجود قائمة تشغيل
            const queue = distube.getQueue(message);

            if (!queue || !queue.songs.length) {
                return message.reply({ 
                    content: `**:no_entry_sign: There must be music playing to use this command!**`, 
                    ephemeral: true 
                });
            }

            // التأكد من أن المستخدم في نفس قناة الصوت مع البوت
            if (message.guild.members.me.voice?.channelId && 
                message.member.voice.channelId !== message.guild.members.me?.voice?.channelId) {
                return message.reply({ 
                    content: `:no_entry_sign: You must be listening in \`${message.guild.members.me?.voice?.channel.name}\` to use this command!`, 
                    ephemeral: true 
                });
            }

            // الحصول على اسم الأغنية
            const song = queue.songs[0]; // الأغنية الحالية
            const songName = song.name;

            // إرسال رسالة البحث
            const replyMessage = await message.reply({ content: `**:watch: Searching for lyrics for "${songName}"...**`, ephemeral: true });

            // البحث عن كلمات الأغنية
            const lyrics = await lyricsFinder(songName);
            if (!lyrics) {
                return replyMessage.edit({ 
                    content: `:x: Sorry, I couldn't find the lyrics for **${songName}**.`,
                    ephemeral: true 
                });
            }

            // تقسيم النص إلى أجزاء إذا كان كبيرًا جدًا
            const chunks = lyrics.match(/.{1,4000}/gs); // تقسيم النص إلى أجزاء لا تزيد عن 4000 حرف
            const embeds = chunks.map((chunk, index) => {
                return new EmbedBuilder()
                    .setColor(config.TertiaryEmbedColor)
                    .setTitle(index === 0 ? `Lyrics for: ${songName}` : null) // العنوان فقط في الجزء الأول
                    .setDescription(chunk)
                    .setFooter({ text: `Part ${index + 1} of ${chunks.length}` });
            });

            // إرسال الكلمات في رد واحد
            await replyMessage.edit({content: null ,embeds: embeds, ephemeral: true });
        } catch (err) {
            console.error(err);
            message.reply({ 
                content: `:x: An error occurred while fetching the lyrics. Please try again later.`,
                ephemeral: true 
            });
        }
    }
};
