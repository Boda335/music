const { prefix,MainEmbedColor } = require('../config.json');
const { ChannelType,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle} = require('discord.js');

module.exports = {
  name: 'guildCreate',
  async execute(client, guild) {
    try {
      // البحث عن أول قناة نصية متاحة في السيرفر
      const channel = guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText
      );
      const em = new EmbedBuilder()
        .setAuthor({ name: `${guild.name}`, iconURL: guild.iconURL() })
        .setTitle(`Thanks for adding me to your server! \`${guild.name}\``)
        .setDescription(
          `*To get started, join a voice channel and type ${prefix}play to play a song* \n\n *If you have any questions or need help [click here](https://discord.gg/Wn6z6yD7n3) to join the support server*\n\n*if you need any help, type* **\`${prefix}help | /help**\``
        )
        .setColor(MainEmbedColor)

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setURL("https://discord.gg/Wn6z6yD7n3")
          .setStyle(ButtonStyle.Link)
    )
      if (channel) {
        channel.send({ embeds: [em], components: [row] });
      } else {
        console.log(`لا توجد قناة نصية متاحة في السيرفر: ${guild.name}`);
      }
    } catch (err) {
      console.error("حدث خطأ في حدث الانضمام إلى السيرفر:", err);
    }
  },
};
