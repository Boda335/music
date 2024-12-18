const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const distube = require('../../client/distube');
const config = require('../../config.json');
const client = require('../../index');

module.exports = {
    name: "queue",
    description: "Display the queue of the current tracks in the playlist.",
    options: [],
    async execute(client, interaction) {
        try {
            // التحقق من القناة الصوتية
            if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId)
                return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });

            if (!interaction.member.voice.channel)
                return interaction.reply({ content: ":no_entry_sign: You must join a voice channel to use that!", ephemeral: true });

            // الحصول على الطابور الحالي
            const queue = distube.getQueue(interaction);
            if (!queue) return interaction.reply({ content: `:no_entry_sign: There must be music playing to use that!`, ephemeral: true });

            // إعدادات الصفحة
            const MAX_SONGS = 10;
            const totalPages = Math.ceil(queue.songs.length / MAX_SONGS);
            const userId = interaction.user.id;

            // تعريف الصفحة الحالية
            if (!userPageData[userId]) userPageData[userId] = 0;
            let currentPage = userPageData[userId];

            // إعداد الطابور لعرض الصفحة الأولى
            const queueList = queue.songs.slice(currentPage * MAX_SONGS, (currentPage + 1) * MAX_SONGS)
                .map((song, index) =>
                    `**\`${currentPage * MAX_SONGS + index + 1}\`| [${song.name}](${song.url})\n${config.emoji.arrow}<@${song.user.id}> (\`${song.formattedDuration}\`)**`
                ).join("\n");

            // بناء Embed للعرض
            let embed = new EmbedBuilder()
                .setColor(config.SecondaryEmbedColor)
                .setTitle("Current Queue")
                .setDescription(queueList)
                .setTimestamp()
                .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} - Total: ${queue.songs.length} songs` });

            // أزرار التنقل
            let right = new ButtonBuilder()
                .setCustomId('right')
                .setEmoji(config.emoji.rightarrow)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage >= totalPages - 1);

            let left = new ButtonBuilder()
                .setCustomId('left')
                .setEmoji(config.emoji.leftarrow)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0);

            let row = new ActionRowBuilder()
                .addComponents(left, right);

            // إرسال الرسالة
            const message = await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            // كوليكتور الأزرار
            const filter = (i) => i.user.id === userId;
            const collector = message.createMessageComponentCollector({
                filter,
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'right' || i.customId === 'left') {
                    await i.deferUpdate();

                    // تحديث الصفحة الحالية
                    if (i.customId === 'right' && currentPage < totalPages - 1) {
                        currentPage++;
                    } else if (i.customId === 'left' && currentPage > 0) {
                        currentPage--;
                    }

                    userPageData[userId] = currentPage;

                    // تحديث قائمة الأغاني
                    const updatedQueueList = queue.songs.slice(currentPage * MAX_SONGS, (currentPage + 1) * MAX_SONGS)
                        .map((song, index) =>
                            `**\`${currentPage * MAX_SONGS + index + 1}\`| [${song.name}](${song.url})\n${config.emoji.arrow}<@${song.user.id}> (\`${song.formattedDuration}\`)**`
                        ).join("\n");

                    // تحديث Embed والأزرار
                    const updatedEmbed = new EmbedBuilder()
                        .setColor(config.SecondaryEmbedColor)
                        .setTitle("Current Queue")
                        .setDescription(updatedQueueList)
                        .setTimestamp()
                        .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} - Total: ${queue.songs.length} songs` });

                    let updatedLeft = new ButtonBuilder()
                        .setCustomId('left')
                        .setEmoji(config.emoji.leftarrow)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0);

                    let updatedRight = new ButtonBuilder()
                        .setCustomId('right')
                        .setEmoji(config.emoji.rightarrow)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage >= totalPages - 1);

                    let updatedRow = new ActionRowBuilder()
                        .addComponents(updatedLeft, updatedRight);

                    await i.editReply({
                        embeds: [updatedEmbed],
                        components: [updatedRow]
                    });
                }
            });

            // إنهاء الكوليكتور
            collector.on('end', async () => {
                let disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('left').setDisabled(true).setEmoji(config.emoji.leftarrow).setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('right').setDisabled(true).setEmoji(config.emoji.rightarrow).setStyle(ButtonStyle.Secondary)
                    );

                await message.edit({
                    components: [disabledRow]
                });
            });

        } catch (err) {
            console.log(err);
        }
    },
};

const userPageData = {}; // لتخزين الصفحة الحالية لكل مستخدم
