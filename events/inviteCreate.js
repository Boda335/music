const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require('../config.json'); // إعدادات البوت
module.exports = {
  name: "guildCreate",
  async execute(client, guild) {
    try {
      // جلب سجلات التدقيق الخاصة بالسيرفر
      const auditLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: 28 // نوع الحدث لإضافة بوت (TYPE: Bot Add)
      });

      // الحصول على السجل الأخير من سجلات التدقيق
      const log = auditLogs.entries.first();
      if (!log) return;

      // الحصول على الشخص الذي قام بدعوة البوت
      const inviter = log.executor;

      // إنشاء رسالة الترحيب كـ Embed
      const em = new EmbedBuilder()
        .setAuthor({ name: `${guild.name}`, iconURL: guild.iconURL() })
        .setTitle(`Thanks for adding me to your server! \`${guild.name}\``)
        .setDescription(
          `*To get started, join a voice channel and type ${config.prefix}play to play a song* \n\n *If you have any questions or need help [click here](https://discord.gg/Wn6z6yD7n3) to join the support server*\n\n*if you need any help, type* **\`${config.prefix}help | /help**\``
        )
        .setColor(config.MainEmbedColor);
      // إنشاء زر الدعم
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Support')
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/Wn6z6yD7n3") // رابط سيرفر الدعم
        );

      // إرسال رسالة للشخص الذي أضاف البوت
      if (inviter) {
        await inviter.send({ embeds: [em], components: [row] });
      } else {
        console.log("تعذر العثور على الشخص الذي أضاف البوت.");
      }
    } catch (error) {
      console.error("حدث خطأ أثناء إرسال رسالة الترحيب:", error);
    }
  }
};
