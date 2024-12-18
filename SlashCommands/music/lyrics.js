const { EmbedBuilder } = require("discord.js");
const distube = require('../../client/distube');
const lyricsFinder = require('lyrics-finder');
const config = require('../../config.json');
module.exports = {
    name: "lyrics",
    description: "Search for the lyrics of the current playing song.",
    async execute(client, interaction, args) {
        try {
            // التأكد من وجود قائمة تشغيل
            const queue = distube.getQueue(interaction);

            if (!queue || !queue.songs.length) {
                return interaction.reply({ 
                    content: `**:no_entry_sign: There must be music playing to use this command!**`, 
                    ephemeral: true 
                });
            }

            // التأكد من أن المستخدم في نفس قناة الصوت مع البوت
            if (interaction.guild.members.me.voice?.channelId && 
                interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
                return interaction.reply({ 
                    content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use this command!`, 
                    ephemeral: true 
                });
            }

            // الحصول على اسم الأغنية
            const song = queue.songs[0]; // الأغنية الحالية
            const songName = song.name;

            // إرسال رسالة البحث
            await interaction.reply({ content: `**:watch: Searching for lyrics for "${songName}"...**`, ephemeral: true });

            // البحث عن كلمات الأغنية
            const lyrics = await lyricsFinder(songName);
            if (!lyrics) {
                return interaction.editReply({ 
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
            await interaction.editReply({ embeds: embeds, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.editReply({ 
                content: `:x: An error occurred while fetching the lyrics. Please try again later.`,
                ephemeral: true 
            });
        }
    }
};
