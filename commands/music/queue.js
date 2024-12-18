const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const distube = require('../../client/distube');
const config = require('../../config.json');

module.exports = {
    name: "queue",
    description: "Displays the current song queue.",
    cooldown: 5000,
    aliases: ['q','list'],
    async execute(client, message, args) {
        try {
            // التحقق من القناة الصوتية
            if (message.guild.members.me.voice?.channelId && message.member.voice.channelId !== message.guild.members.me?.voice?.channelId) {
                return message.reply({ content: `:no_entry_sign: You must be listening in \`${message.guild.members.me?.voice?.channel.name}\` to use that!` });
            }
            if (!message.member.voice.channel) {
                return message.reply({ content: ":no_entry_sign: You must join a voice channel to use that!" });
            }

            // الحصول على الطابور الحالي
            const queue = distube.getQueue(message);
            if (!queue) return message.reply({ content: `:no_entry_sign: There must be music playing to use that!` });

            // إعدادات الصفحات
            const MAX_SONGS = 10;
            const totalPages = Math.ceil(queue.songs.length / MAX_SONGS);
            let currentPage = 0; // البداية من الصفحة الأولى

            const queueList = queue.songs.slice(currentPage * MAX_SONGS, (currentPage + 1) * MAX_SONGS)
                .map((song, index) => 
                    `**\`${currentPage * MAX_SONGS + index + 1}\`| [${song.name}](${song.url})\n${config.emoji.arrow}<@${song.user.id}> (\`${song.formattedDuration}\`)**`
                ).join("\n");

            // بناء الـ Embed لعرض الطابور
            const embed = new EmbedBuilder()
                .setColor(config.SecondaryEmbedColor)
                .setTitle("Current Queue")
                .setDescription(queueList)
                .setTimestamp()
                .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} - Total: ${queue.songs.length} songs` });

            // إنشاء الأزرار للتنقل بين الصفحات
            const leftButton = new ButtonBuilder()
                .setCustomId('left')
                .setEmoji(config.emoji.leftarrow)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0);

            const rightButton = new ButtonBuilder()
                .setCustomId('right')
                .setEmoji(config.emoji.rightarrow)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage >= totalPages - 1);

            const actionRow = new ActionRowBuilder().addComponents(leftButton, rightButton);

            // إرسال الرسالة مع Embed والأزرار
            const sentMessage = await message.reply({
                embeds: [embed],
                components: [actionRow]
            });

            // كوليكتور الأزرار
            const filter = (i) => i.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({
                filter,
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'right' && currentPage < totalPages - 1) {
                    currentPage++;
                } else if (interaction.customId === 'left' && currentPage > 0) {
                    currentPage--;
                }

                // تحديث الـ Embed والأزرار بعد التنقل
                const updatedQueueList = queue.songs.slice(currentPage * MAX_SONGS, (currentPage + 1) * MAX_SONGS)
                    .map((song, index) =>
                        `**\`${currentPage * MAX_SONGS + index + 1}\`| [${song.name}](${song.url})\n${config.emoji.arrow}<@${song.user.id}> (\`${song.formattedDuration}\`)**`
                    ).join("\n");

                const updatedEmbed = new EmbedBuilder()
                    .setColor(config.SecondaryEmbedColor)
                    .setTitle("Current Queue")
                    .setDescription(updatedQueueList)
                    .setTimestamp()
                    .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} - Total: ${queue.songs.length} songs` });

                const updatedLeftButton = new ButtonBuilder()
                    .setCustomId('left')
                    .setEmoji(config.emoji.leftarrow)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0);

                const updatedRightButton = new ButtonBuilder()
                    .setCustomId('right')
                    .setEmoji(config.emoji.rightarrow)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= totalPages - 1);

                const updatedActionRow = new ActionRowBuilder().addComponents(updatedLeftButton, updatedRightButton);

                // تحديث الرسالة
                await interaction.update({
                    embeds: [updatedEmbed],
                    components: [updatedActionRow]
                });
            });

            // إنهاء الكوليكتور بعد مرور الوقت
            collector.on('end', async () => {
                const disabledLeftButton = new ButtonBuilder()
                    .setCustomId('left')
                    .setEmoji(config.emoji.leftarrow)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const disabledRightButton = new ButtonBuilder()
                    .setCustomId('right')
                    .setEmoji(config.emoji.rightarrow)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const disabledActionRow = new ActionRowBuilder().addComponents(disabledLeftButton, disabledRightButton);

                await sentMessage.edit({
                    components: [disabledActionRow]
                });
            });

        } catch (err) {
            console.error(err);
        }
    },
};
