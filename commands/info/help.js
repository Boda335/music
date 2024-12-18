const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { PannelIMG, MainEmbedColor,prefix,mainIMG } = require('../../config.json');
const client = require('../../index')
module.exports = {
    name: "help",
    description: 'Feeling lost?',
    async execute(client, message) {
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
                .setCustomId('section1')
                .setPlaceholder('Select a category')
                .addOptions(
                    { label: 'Music Commands', value: 'music1' },
                    { label: 'Music Plannel', value: 'pannel1' },
                )

            let row = new ActionRowBuilder()
                .addComponents(inviteBTN, supportBTN)
            let row2 = new ActionRowBuilder()
                .addComponents(sectionSM)
                message.reply({ embeds: [embed], components: [row2, row], ephemeral: true })
        } catch (err) {
            console.log(err)
        }
    },
};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'section1') {
            const value = interaction.values[0];
            let musicEmbed = new EmbedBuilder()
                .setTitle("Music Commands")
                .setDescription(`-# Here are all the available music commands you can use:`)
                .setColor(MainEmbedColor)
                .addFields(
                    { name: `${prefix}247`, value: `Toggles the 24/7 mode. This makes the bot doesn't leave the voice channel until you stop it.\n Shortcuts: \`['24/7','24-7']\``, inline: false },
                    { name: `${prefix}autoplay`, value: `Toggles autoplay for the current guild.\n Shortcuts: \`['ap','auto']\``, inline: false },
                    { name: `${prefix}join`, value: `join the voice channel.\n Shortcuts: \`No aliases\``, inline: false },
                    { name: `${prefix}leave`, value: `leave the voice channel.\n Shortcuts: \`['disconnect','dc']\``, inline: false },
                    { name: `${prefix}repeat`, value: `Toggles the repeat mode.\n Shortcuts: \`['loop','rp']\``, inline: false },
                    { name: `${prefix}lyrics`, value: `Display lyrics of a song.\n Shortcuts: \`['ly','lyric']\``, inline: false },
                    { name: `${prefix}nowplaying`, value: `Shows what is song that the bot is currently playing.\n Shortcuts: \`['np','status','song','songinfo','playing']\``, inline: false },
                    { name: `${prefix}pause`, value: `Pauses the currently playing track.\n Shortcuts: \`['pu','break']\``, inline: false },
                    { name: `${prefix}play`, value: `Add a song to queue and plays it.\n Shortcuts: \`[p]\``, inline: false },
                    { name: `${prefix}previous`, value: `Plays the previous song in the queue.\n Shortcuts: \`['prev','back','b']\``, inline: false },
                    { name: `${prefix}queue`, value: `Display the queue of the current tracks in the playlist.\n Shortcuts: \`['q','list']\``, inline: false },
                    { name: `${prefix}resume`, value: `Resumes the currently paused track.\n Shortcuts: \`['r','continue']\``, inline: false },
                    { name: `${prefix}search`, value: `Search song and play music.\n Shortcuts: \`['find','yts','youtube']\``, inline: false },
                    { name: `${prefix}skip`, value: `Skip the current song.\n Shortcuts: \`['s']\``, inline: false },
                    { name: `${prefix}stop`, value: `Stop the current song and clears the entire music queue.\n Shortcuts: \`['st']\``, inline: false },
                    { name: `${prefix}volume`, value: `Changes/Shows the current volume.\n Shortcuts: \`['vol']\``, inline: false },
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
                .setCustomId('section1')  // Ensure the same ID is used if you're updating the select menu
                .setPlaceholder('Select a category')
                .addOptions(
                    { label: 'Music Commands', value: 'music1' },
                    { label: 'Music Plannel', value: 'pannel1' },
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

            if (value === 'music1') {
                // Update the interaction with music commands embed
                interaction.update({ embeds: [musicEmbed], components: [row2, row], ephemeral: true });
            } else if (value === 'pannel1') {
                // Update the interaction with music panel embed
                interaction.update({ embeds: [pannelEmbed], components: [row2, row], ephemeral: true });
            }
        }
    }
});