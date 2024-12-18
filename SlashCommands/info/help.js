const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { PannelIMG, MainEmbedColor,prefix,mainIMG } = require('../../config.json');
const client = require('../../index')
module.exports = {
    name: "help",
    description: 'Feeling lost?',
    async execute(client, interaction) {
        try {

            let embed = new EmbedBuilder()
                .setAuthor({ name: `Information`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`-# Follow one of the buttons in these messages below to get more information.`)
                .setImage(mainIMG)
                .setColor(MainEmbedColor)

            let inviteBTN = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Invite Bot')
                .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)

            let supportBTN = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Server Support')
                .setURL(`https://discord.gg/Wn6z6yD7n3`)

            let sectionSM = new StringSelectMenuBuilder()
                .setCustomId('section')
                .setPlaceholder('Select a category')
                .addOptions(
                    { label: 'Music Commands', value: 'music' },
                    { label: 'Music Plannel', value: 'pannel' },
                )

            let row = new ActionRowBuilder()
                .addComponents(inviteBTN, supportBTN)
            let row2 = new ActionRowBuilder()
                .addComponents(sectionSM)
            interaction.reply({ embeds: [embed], components: [row2, row], ephemeral: true })
        } catch (err) {
            console.log(err)
        }
    },
};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'section') {
            const value = interaction.values[0];
            let musicEmbed = new EmbedBuilder()
                .setTitle("Music Commands")
                .setDescription(`-# Here are all the available music commands you can use:`)
                .setColor(MainEmbedColor)
                .addFields(
                    { name: `/247`, value: `Toggles the 24/7 mode. This makes the bot doesn't leave the voice channel until you stop it.`, inline: false },
                    { name: `/autoplay`, value: `Toggles autoplay for the current guild.`, inline: false },
                    { name: `/join`, value: `join the voice channel.`, inline: false },
                    { name: `/leave`, value: `leave the voice channel.`, inline: false },
                    { name: `/repeat`, value: `Toggles the repeat mode.`, inline: false },
                    { name: `/lyrics`, value: `Display lyrics of a song`, inline: false },
                    { name: `/nowplaying`, value: `Shows what is song that the bot is currently playing.`, inline: false },
                    { name: `/pause`, value: `Pauses the currently playing track.`, inline: false },
                    { name: `/play`, value: `Add a song to queue and plays it.`, inline: false },
                    { name: `/previous`, value: `Plays the previous song in the queue.`, inline: false },
                    { name: `/queue`, value: `Display the queue of the current tracks in the playlist.`, inline: false },
                    { name: `/resume`, value: `Resumes the currently paused track.`, inline: false },
                    { name: `/search`, value: `Search song and play music.`, inline: false },
                    { name: `/skip`, value: `Skip the current song.`, inline: false },
                    { name: `/stop`, value: `Stop the current song and clears the entire music queue.`, inline: false },
                    { name: `/volume`, value: `Changes/Shows the current volume.`, inline: false },
                )

            let inviteBTN = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Invite Bot')
                .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)

            let supportBTN = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Server Support')
                .setURL(`https://discord.gg/Wn6z6yD7n3`)

            let sectionSM = new StringSelectMenuBuilder()
                .setCustomId('section')
                .setPlaceholder('Select a category')
                .addOptions(
                    { label: 'Music Commands', value: 'music' },
                    { label: 'Music Plannel', value: 'pannel' },
                )

            let row = new ActionRowBuilder()
                .addComponents(inviteBTN, supportBTN)
            let row2 = new ActionRowBuilder()
                .addComponents(sectionSM)

            let pannelEmbed = new EmbedBuilder()
                .setTitle("Music Plannel")
                .setImage(PannelIMG)
                .setDescription(`-# Here a guide on how to use the music plannel.`)
                .setColor(MainEmbedColor)
            if (value === 'music') {
                interaction.update({ embeds: [musicEmbed], components: [row2, row], ephemeral: true });
            } else if (value === 'pannel') {
                interaction.update({ embeds: [pannelEmbed], components: [row2, row], ephemeral: true });
            }
        }
    }
});