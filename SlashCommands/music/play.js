const { ApplicationCommandOptionType } = require("discord.js");
const distube = require('../../client/distube');
const wait = require('node:timers/promises').setTimeout;
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "play",
    description: "Add a song to queue and plays it.",
    options: [
        {
            name: `song`,
            description: `the song to play`,
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "input",
                    description: "song name or url",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: `playlist`,
            description: `the playlist to play`,
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    async execute(client, interaction) {
        let args = interaction.options.getString('input');
        const songTitle = args;
        const subbcomand = interaction.options.getSubcommand();

        try {
            if (subbcomand === "song") {
                if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
                    return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
                }
                if (!interaction.member.voice.channel)
                    return interaction.reply({ content: ":no_entry_sign: You must join a voice channel to use that!", ephemeral: true });
                if (!songTitle) return interaction.reply({ content: `:no_entry_sign: You should type song name or url.`, ephemeral: true });

                const queue = distube.getQueue(interaction);
                interaction.reply({ content: `:watch: Searching ... (\`${songTitle}\`)` });
                await wait(3000);
                await interaction.deleteReply();

                const voiceChannel = interaction.member?.voice?.channel;
                if (voiceChannel) {
                    distube.play(voiceChannel, songTitle, {
                        interaction,
                        textChannel: interaction.channel,
                        member: interaction.member,
                    });
                }
            }

            // التعامل مع الخيار playlist
            if (subbcomand === "playlist") {
                const userId = interaction.user.id;
                const filePath = path.join(__dirname, '../../Database/database.json');
            
                // قراءة ملف قاعدة البيانات
                let favorites = {};
                if (fs.existsSync(filePath)) {
                    favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
            
                // التأكد من وجود مفضلة للمستخدم
                if (!favorites[userId] || favorites[userId].length === 0) {
                    return interaction.reply({ content: ":no_entry_sign: You don't have any favorites to play!", ephemeral: true });
                }
            
                const voiceChannel = interaction.member?.voice?.channel;
                if (!voiceChannel) return interaction.reply({ content: ":no_entry_sign: You must join a voice channel to play your playlist!", ephemeral: true });
            
                // إرسال رسالة للمستخدم
                interaction.reply({ content: `:watch: Playing your playlist...` });
            
                // تشغيل أول أغنية في المفضلة
                const queue = distube.getQueue(interaction);
                const firstSong = favorites[userId][0];
                distube.play(voiceChannel, firstSong.songurl, {
                    interaction,
                    textChannel: interaction.channel,
                    member: interaction.member,
                });
            
                // الانتظار 5 ثواني قبل إضافة باقي الأغاني
                await wait(5000); // الانتظار 5 ثواني
            
                // إضافة باقي الأغاني في المفضلة
                for (let i = 1; i < favorites[userId].length; i++) {
                    const song = favorites[userId][i];
                    distube.play(voiceChannel, song.songurl, {
                        interaction,
                        textChannel: interaction.channel,
                        member: interaction.member,
                    });
                }
            
                await interaction.deleteReply();
            }
            

        } catch (err) {
            console.log(err);
        }
    },
};
