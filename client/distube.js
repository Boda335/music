const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const client = require("../index");
const config = require("../config.json");
const { DisTube, Song, SearchResultVideo } = require("distube");
const { DeezerPlugin } = require("@distube/deezer");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const PlayerMap = new Map();
const ytsr = require('@distube/ytsr');
const wait = require('node:timers/promises').setTimeout;

const lyricsFinder = require('lyrics-finder');
let spotifyoptions = {
	parallel: true,
	emitEventsAfterFetching: false,
};
if (config.spotify_api.enabled) {
	spotifyoptions.api = {
		clientId: config.spotify_api.clientId,
		clientSecret: config.spotify_api.clientSecret,
	};
}

const distube = new DisTube(client, {
	emitNewSongOnly: true,
	leaveOnEmpty: false,
	leaveOnFinish: false,
	leaveOnStop: false,
	savePreviousSongs: true,
	emitAddSongWhenCreatingQueue: true,
	emitAddListWhenCreatingQueue: true,
	searchSongs: 0,
	youtubeCookie: config.youtubeCookie,
	nsfw: false,
	emptyCooldown: 0,
	ytdlOptions: {
		highWaterMark: 1024 * 1024 * 64,
		quality: "highestaudio",
		format: "audioonly",
		liveBuffer: 60000,
		dlChunkSize: 1024 * 1024 * 4,
	},
	plugins: [
		new SpotifyPlugin(spotifyoptions),
		new SoundCloudPlugin(),
		new DeezerPlugin(),
	],
});
const status = (queue) => {
	try {
		`Volume: \`${queue.volume}%\` | Loop: \`${queue.repeatMode
			? queue.repeatMode === 2
				? "All Queue"
				: "This Song"
			: "Off"
			}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\` | Filter: \`${queue.filters.join(", ") || "Off"
			}\``;
	} catch (err) {
		console.log(err);
	}
};

distube.on("initQueue", (queue) => {
	queue.autoplay = false;
	queue.volume = 100;
	queue.repeatMode = 0;
});

distube.on(`playSong`, async (queue, track) => {
	try {
		var newQueue = distube.getQueue(queue.id);
		var newTrack = track;

		// إنشاء Embed مباشرة هنا بدلاً من دالة خارجية
		const embed = new EmbedBuilder()
			.setColor(config.MainEmbedColor)
			.setAuthor({ name: `${queue.textChannel.guild.name} - Now Playing`, iconURL: queue.textChannel.guild.iconURL() })
			.setImage(`https://img.youtube.com/vi/${newTrack.id}/mqdefault.jpg`)
			.setDescription(`**Queue length ${newQueue.songs.length - 1}\n:arrow_forward: [${newTrack.name}](${newTrack.url})\n Duration \`${newTrack.formattedDuration}\`\n Artist \`${newTrack.uploader.name}\`** \n *Requested by <@${newTrack.user.id}>*`)
			.setThumbnail(config.PannelIMG)
			.setFooter({ text: `Volume: ${newQueue.volume}% || Autoplay : ${newQueue.autoplay ? "On" : "Off"} || Repeat : ${newQueue.repeatMode === 2 ? "All Queue" : (newQueue.repeatMode === 1 ? "This Song" : "Off")}`, iconURL: newTrack.user.avatarURL() });

		// إنشاء الأزرار
		const row1 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`autoPlay`).setEmoji(config.emoji.autoplay).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`back`).setEmoji(config.emoji.back).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`pause`).setEmoji(config.emoji.pause).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`skip`).setEmoji(config.emoji.skip).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`repeat`).setEmoji(config.emoji.repeat).setStyle(ButtonStyle.Secondary)
		);

		const row2 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`volumedown`).setEmoji(config.emoji.volumedown).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`rewind`).setEmoji(config.emoji.rewind).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`favorite`).setEmoji(config.emoji.favorite).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`forward`).setEmoji(config.emoji.forward).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`volumeup`).setEmoji(config.emoji.volumeup).setStyle(ButtonStyle.Secondary)
		);

		const row3 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`lyrics`).setEmoji(config.emoji.lyrics).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`shuffle`).setEmoji(config.emoji.shuffle).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`stop`).setEmoji(config.emoji.stop).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`filter`).setEmoji(config.emoji.filter).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`artist`).setEmoji(config.emoji.artist).setStyle(ButtonStyle.Secondary)
		);

		const searchResults = await ytsr(newTrack.uploader.name, { safeSearch: true, limit: 10 });
		if (!searchResults.items || searchResults.items.length === 0) {
			return ("No results found.");
		}

		// التأكد من أن القيم فريدة (لا تتكرر) في options
		let seenValues = new Set();
		let suggestionTrack = new StringSelectMenuBuilder()
			.setCustomId("suggestion")
			.setPlaceholder("Suggestion Track")
			.setMinValues(1)
			.setMaxValues(1)
			.addOptions(
				searchResults.items
					.filter(item => item.type === 'video') // التأكد من أن العنصر هو فيديو
					.map((item) => {
						let value = item.url;
						if (seenValues.has(value)) {
							return null; // تجاهل الخيارات المكررة
						}
						seenValues.add(value); // إضافة القيمة للقيم المعروفة

						return {
							label: item.name.length > 100 ? item.name.slice(0, 100) + '...' : item.name, // استخدام item.name بدلاً من item.title
							description: item.duration,
							emoji: config.emoji.musicTrack,
							value: item.url,
						};
					})
					.filter(option => option !== null) // إزالة الخيارات المكررة من المصفوفة
			);

		const row = new ActionRowBuilder().addComponents(suggestionTrack);

		await queue.textChannel.send({
			embeds: [embed],
			components: [row, row1, row2, row3],
		}).then((msg) => {
			PlayerMap.set("currentmsg", msg.id);
			return msg;
		});
	} catch (err) {
		console.log(err);
	}
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isStringSelectMenu()) {
		if (interaction.customId === 'suggestion') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			const selectedTrackUrl = interaction.values[0];

			const searchResults = await ytsr(selectedTrackUrl, { safeSearch: true, limit: 1 });

			if (!searchResults.items || searchResults.items.length === 0) {
				return interaction.reply("No results found.");
			}

			const selectedTrack = searchResults.items[0];

			try {
				const queue = distube.getQueue(interaction.guild.id);
				if (queue) {
					queue.metadata = {
						selectedTrackUrl: selectedTrack.url,
					};
				}
				await interaction.reply({ content: `**${selectedTrack.name}** added to the queue (\`${selectedTrack.duration}\`)`, ephemeral: true });

				distube.play(interaction.member.voice.channel, selectedTrack.url, {
					member: interaction.member,
					textChannel: interaction.channel,
					message: interaction.message,
				});
			} catch (err) {
				console.error("Error while adding track to the queue:", err);
				interaction.reply("There was an error adding the track to the queue.");
			}
		} else if (interaction.customId === 'repeatSelect') {
			// التحقق من أن المستخدم في نفس القناة الصوتية مثل البوت
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			// التحقق من وجود موسيقى مشغلة
			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			// الحصول على القيمة المختارة من المستخدم
			const value = interaction.values[0]; // تذكر أن `interaction.values` تحتوي على القيمة المختارة من القائمة

			// تفعيل أو تعطيل التكرار بناءً على الاختيار
			if (value === 'queue') {
				distube.setRepeatMode(interaction.guild.id, 2); // تكرار القائمة بأكملها
				return interaction.update({ content: `**> ${config.emoji.queuerepet} repeating the entire queue**`, embeds: [], components: [], ephemeral: true });
			} else if (value === 'song') {
				distube.setRepeatMode(interaction.guild.id, 1); // تكرار الأغنية الحالية فقط
				return interaction.update({ content: `**> ${config.emoji.songrepet} repeating the current song**`, embeds: [], components: [], ephemeral: true });
			} else if (value === 'off') {
				distube.setRepeatMode(interaction.guild.id, 0); // إيقاف التكرار
				return interaction.update({ content: `**> ${config.emoji.stop} stopped repeating**`, embeds: [], components: [], ephemeral: true });
			}
		} else if (interaction.customId === 'filterselect') {
			// التحقق من أن المستخدم في نفس القناة الصوتية مثل البوت
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			// التحقق من وجود موسيقى مشغلة
			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const value = interaction.values[0]; // الحصول على الفلتر المختار من القائمة

			// الحصول على قائمة التشغيل (الطابور)
			const queue = distube.getQueue(interaction.guild.id);

			// التحقق من الفلتر المختار وإضافته
			switch (value) {
				case 'bassboost':
					queue.filters.add('bassboost');
					break;
				case 'echo':
					queue.filters.add('echo');
					break;
				case 'karaoke':
					queue.filters.add('karaoke');
					break;
				case 'nightcore':
					queue.filters.add('nightcore');
					break;
				case 'vaporwave':
					queue.filters.add('vaporwave');
					break;
				case 'reverse':
					queue.filters.add('reverse');
					break;
				case 'surround':
					queue.filters.add('surround');
					break;
				case '3d':
					queue.filters.add('3d');
					break;
				case 'flanger':
					queue.filters.add('flanger');
					break;
				case 'gate':
					queue.filters.add('gate');
					break;
				case 'haas':
					queue.filters.add('haas');
					break;
				case 'lowpass':
					queue.filters.add('lowpass');
					break;
				case 'lowboost':
					queue.filters.add('lowboost');
					break;
				case 'phaser':
					queue.filters.add('phaser');
					break;
				case 'tremolo':
					queue.filters.add('tremolo');
					break;
				case 'highpass':
					queue.filters.add('highpass');
					break;
				case 'clear':
					queue.filters.clear();
					break;
				// إذا تم اختيار فلتر غير مدعوم
				default:
					return interaction.reply({ content: `:no_entry_sign: Unknown filter selected!`, ephemeral: true });
			}

			// تطبيق الفلاتر على قائمة التشغيل
			queue.setFilter(queue.filters);  // هنا يتم استخدام `setFilter` بدلاً من `filters.set`

			// الرد على التفاعل بتأكيد التطبيق
			return interaction.update({ content: `**:white_check_mark: Applied ${value} filter!**`, embeds: [], components: [], ephemeral: true });
		}



	}
});

client.on('interactionCreate', async (interaction) => {
	// التأكد من أن التفاعل هو select menu
	if (interaction.isButton()) {
		// التأكد من أن السيلكت هو السيلكت الذي تم إنشاؤه في البداية
		if (interaction.customId === 'autoPlay') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.reply({ content: `:no_entry_sign: There must be music playing to use that!`, ephemeral: true });
			}

			const mode = distube.toggleAutoplay(interaction);

			// إرسال الرد العادي
			interaction.reply({ content: `> ${config.emoji.musicTrack} \`${interaction.user.globalName}\` Set autoplay mode to **${queue.autoplay ? "On" : "Off"}**`, fetchReply: true })
				.then((message) => {
					setTimeout(() => {
						message.delete();
					}, 5000);
				});
		} else if (interaction.customId === 'back') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			if (!queue.previousSongs || queue.previousSongs.length === 0) {
				return interaction.reply({ content: `:no_entry_sign: There is no previous song in this queue`, ephemeral: true });
			} else {
				// استرجاع الأغنية السابقة
				const previousSong = queue.previousSongs[queue.previousSongs.length - 1];

				await distube.previous(interaction);
				interaction.reply({ content: `> ${config.emoji.musicTrack} \`${interaction.user.globalName}\` played the previous song **${previousSong.name}`, fetchReply: true })
					.then((message) => {
						setTimeout(() => {
							message.delete();
						}, 5000);
					});
			}
		} else if (interaction.customId === 'pause') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			if (queue.playing) {
				await queue.pause(); // إيقاف التشغيل
				interaction.update({
					components: interaction.message.components.map(row => {
						row.components = row.components.map(button => {
							if (button.customId === 'pause') {
								// تحديث الزر ليظهر على أنه Resume
								return new ButtonBuilder()
									.setCustomId('pause')
									.setEmoji(config.emoji.play)
									.setStyle(ButtonStyle.Secondary); // تغيير الزر
							}
							return button;
						});
						return row;
					}),
				});

			} else {
				await queue.resume(); // استئناف التشغيل
				interaction.update({
					components: interaction.message.components.map(row => {
						row.components = row.components.map(button => {
							if (button.customId === 'pause') {
								// تحديث الزر ليظهر على أنه Pause
								return new ButtonBuilder()
									.setCustomId('pause')
									.setEmoji(config.emoji.pause)
									.setStyle(ButtonStyle.Secondary); // تغيير الزر
							}
							return button;

						});
						return row;

					}),

				});
			}
		} else if (interaction.customId === 'skip') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			const song = queue.songs[0]
			let name = song.name
			if (!queue) return interaction.reply({ content: `:no_entry_sign: There must be music playing to use that!`, ephemeral: true })
			if (!queue.autoplay && queue.songs.length <= 1) return interaction.reply({ content: `:no_entry_sign:  this is last song in queue list`, ephemeral: true });
			interaction.reply({ content: `${config.emoji.musicTrack} \`${interaction.user.globalName}\` skipped ${name}`, fetchReply: true })
				.then((message) => {
					setTimeout(() => {
						message.delete();
					}, 5000);
				});
			return distube.skip(interaction);
		} else if (interaction.customId === 'repeat') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			let repeatSelect = new StringSelectMenuBuilder()
				.setCustomId('repeatSelect')
				.setPlaceholder('Select a loop method!')
				.setOptions([
					{
						label: `Queue`,
						description: `Loop the whole queue`,
						emoji: config.emoji.queuerepet,
						value: "queue",
					},
					{
						label: `Song`,
						description: `Loop the current playing song only`,
						emoji: config.emoji.songrepet,
						value: "song",
					},
					{
						label: `Off`,
						description: `Disables the loop`,
						emoji: config.emoji.stop,
						value: "off",
					}
				])
			const row = new ActionRowBuilder().addComponents(repeatSelect);
			interaction.reply({ content: `> **${config.emoji.repeat} Select a loop method!**`, components: [row], ephemeral: true });
		} else if (interaction.customId === 'volumedown') {

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {

				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			const v = distube.getQueue(interaction).volume;
			if (v === 0) {
				interaction.reply({ content: `:no_entry_sign: You can't lower the volume below 1.`, ephemeral: true })

			} else {
				interaction.reply({ content: `> ${config.emoji.musicTrack} \`${interaction.user.globalName}\` Set volume from \`${v}\` to \`${v - 10}\``, fetchReply: true })
					.then((message) => {
						setTimeout(() => {
							message.delete();
						}, 5000);
					});
				return distube.setVolume(interaction, distube.getQueue(interaction).volume - 10);
			}


		} else if (interaction.customId === 'rewind') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const curtime = distube.queues.get(interaction.guild.id).currentTime;

			if (curtime === 0) {
				await interaction.deferUpdate(); // تأجيل التفاعل فقط
				return; // لا حاجة لاتخاذ إجراء آخر
			} else if (curtime < 10) {
				await interaction.deferUpdate(); // تأجيل التفاعل
				return distube.seek(interaction, 0);
			} else {
				const newTime = curtime - 10;
				await interaction.deferUpdate(); // تأجيل التفاعل
				return distube.seek(interaction, newTime);
			}
		} else if (interaction.customId === 'favorite') {
			const fs = require('fs');
			const path = require('path');
			const filePath = path.join(__dirname, '../Database/database.json');

			// التأكد من تشغيل الموسيقى
			const queue = distube.getQueue(interaction);
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const currentSong = queue.songs[0];
			const songName = currentSong.name;
			const songUrl = currentSong.url;
			const userId = interaction.user.id;

			let favorites = {};
			if (fs.existsSync(filePath)) {
				favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			}

			if (!favorites[userId]) {
				favorites[userId] = [];
			}

			const songIndex = favorites[userId].findIndex(favSong => favSong.songurl === songUrl);

			if (songIndex !== -1) {
				favorites[userId].splice(songIndex, 1);
				interaction.reply({
					content: `❌ **${songName}** has been removed from your favorites!`,
					ephemeral: true
				});
			} else {
				favorites[userId].push({
					songname: songName,
					songurl: songUrl,
				});
				interaction.reply({
					content: `✅ **${songName}** has been added to your favorites!`,
					ephemeral: true
				});

			}
			fs.writeFileSync(filePath, JSON.stringify(favorites, null, 4));
		} else if (interaction.customId === 'forward') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const queue = distube.getQueue(interaction);
			if (!queue) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			const curtime = distube.queues.get(interaction.guild.id).currentTime;

			if (curtime === 0) {
				await interaction.deferUpdate();
				return;
			} else {
				const newTime = curtime + 10;
				await interaction.deferUpdate(); // تأجيل التفاعل
				return distube.seek(interaction, newTime);
			}
		} else if (interaction.customId === 'volumeup') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {

				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			const v = distube.getQueue(interaction).volume;
			if (v === 150) {
				interaction.reply({ content: `:no_entry_sign: You can't raise the volume above 150.`, ephemeral: true })

			} else {
				interaction.reply({ content: `> ${config.emoji.musicTrack} \`${interaction.user.globalName}\` Set volume from \`${v}\` to \`${v + 10}\``, fetchReply: true })
					.then((message) => {
						setTimeout(() => {
							message.delete();
						}, 5000);
					});
				return distube.setVolume(interaction, distube.getQueue(interaction).volume + 10);
			}

		} else if (interaction.customId === 'lyrics') {
			const queue = distube.getQueue(interaction);

			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {

				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			interaction.reply({ content: `**> ${config.emoji.search} Searching lyrics...**`, ephemeral: true });

			// الحصول على اسم الأغنية
			const song = queue.songs[0]; // الأغنية الحالية في القائمة
			const songName = song.name;

			// البحث عن كلمات الأغنية
			try {
				const lyrics = await lyricsFinder(songName);
				if (!lyrics) {
					return interaction.editReply({
						content: `:x: Sorry, I couldn't find the lyrics for **${songName}**.`,
						ephemeral: true
					});
				}

				// تقسيم الكلمات إلى أجزاء صغيرة
				const chunks = lyrics.match(/.{1,4000}/gs); // تقسيم النص
				const embeds = chunks.map((chunk, index) => {
					return new EmbedBuilder()
						.setColor(config.TertiaryEmbedColor)
						.setTitle(`Lyrics for: ${songName}`)
						.setDescription(`**${chunk}**`)
						.setFooter({ text: `Part ${index + 1} of ${chunks.length}` });
				});

				// تحديث التفاعل مع Embeds
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply({
						content: null,
						embeds: embeds,
						ephemeral: true
					});
				} else {
					await interaction.editReply({
						content: null,
						embeds: embeds,
						ephemeral: true
					});
				}
			} catch (error) {
				console.error(error);
				return interaction.editReply({
					content: `:x: There was an error fetching the lyrics for **${songName}**.`,
					ephemeral: true
				});
			}
		} else if (interaction.customId === 'shuffle') {
			const queue = distube.getQueue(interaction);

			// التحقق من تواجد المستخدم في نفس القناة الصوتية
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			// التحقق من وجود قائمة تشغيل وتشغيل الموسيقى
			if (!queue || !queue.songs.length) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			interaction.reply({ content: `> ${config.emoji.maintenance} **Shuffle mode is currently under maintenance and development**`, ephemeral: true });
		} else if (interaction.customId === 'stop') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {

				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}
			interaction.reply({ content: `> ${config.emoji.musicTrack} \`${interaction.user.globalName}\` Stopped the music and cleared the queue` })
			return distube.stop(interaction);
		} else if (interaction.customId === 'filter') {
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			if (!distube.queues || distube.queues.size === 0) {

				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}

			let filterSelect = new StringSelectMenuBuilder()
				.setCustomId('filterselect')
				.setPlaceholder('Select a filter')
				.addOptions([
					{
						label: `Bass Boost`,
						description: `Enhances the lower frequencies for a bass-heavy sound.`,
						value: `bassboost`,
					},
					{
						label: `Echo`,
						description: `Adds an echo effect to the audio, creating a sense of reverberation.`,
						value: `echo`,
					},
					{
						label: `Karaoke`,
						description: `Removes vocals from songs, turning them into karaoke-style tracks.`,
						value: `karaoke`,
					},
					{
						label: `Night Core`,
						description: `Speeds up the song and raises the pitch, creating a high-energy feel.`,
						value: `nightcore`,
					},
					{
						label: `Vapor Wave`,
						description: `Adds a slow, dreamy, and nostalgic aesthetic to the audio.`,
						value: `vaporwave`,
					},
					{
						label: `Reverse`,
						description: `Reverses the audio (plays it backward).`,
						value: `reverse`,
					},
					{
						label: `Surround`,
						description: `Enhances the stereo sound, giving a surround-sound effect.`,
						value: `surround`,
					},
					{
						label: `3D`,
						description: ` Provides a 3D audio effect, making the sound seem like it’s coming from all around you.`,
						value: `3d`,
					},
					{
						label: `Flanger`,
						description: `Adds a flanging effect, creating a sweeping, spacey sound.`,
						value: `flanger`,
					},
					{
						label: `Gate`,
						description: `Cuts off the sound when it falls below a certain threshold, creating a gating effect.`,
						value: `gate`,
					},
					{
						label: `Haas`,
						description: `Enhances the sound with a psychoacoustic effect that makes it feel 3D.`,
						value: `haas`,
					},
					{
						label: `Low Pass`,
						description: `Cuts off the higher frequencies, allowing only low frequencies to pass through.`,
						value: `lowpass`,
					},
					{
						label: `Low Boost`,
						description: `Boosts the lower frequencies for a deeper sound.`,
						value: `lowboost`,
					},
					{
						label: `Phaser`,
						description: `Adds a phase-shifting effect to the audio, creating a sweeping sound.`,
						value: `phaser`,
					},
					{
						label: `Tremolo`,
						description: `Modulates the audio volume at a periodic rate, creating a "trembling" effect.`,
						value: `tremolo`,
					},
					{
						label: `High pass`,
						description: `Cuts off the lower frequencies, allowing only high frequencies to pass through.`,
						value: `highpass`,
					},
					{
						label: `8D`,
						description: `Adds an 8D effect, making the sound appear to come from all directions in a dynamic way.`,
						value: `8d`,
					},
					{
						label: `Sub Boost`,
						description: `Boosts the sub-bass frequencies for a deeper, rumbling sound.`,
						value: `subboost`,
					},
					{
						label: `Treble Boost`,
						description: `Enhances the higher frequencies (treble) for a sharper, clearer sound.`,
						value: `trebleboost`,
					},
					{
						label: `Clear Filter`,
						description: `Removes all filters from the audio.`,
						value: `clear`,
					},
				])
			const row = new ActionRowBuilder()
				.addComponents(filterSelect);
			interaction.reply({ content: `> ${config.emoji.maintenance} **Filter mode is currently under maintenance and development**`, ephemeral: true });
		} else if (interaction.customId === 'artist') {
			// تحقق من أن المستخدم في نفس القناة الصوتية
			if (interaction.guild.members.me.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice?.channelId) {
				return interaction.reply({ content: `:no_entry_sign: You must be listening in \`${interaction.guild.members.me?.voice?.channel.name}\` to use that!`, ephemeral: true });
			}

			// تحقق من وجود موسيقى قيد التشغيل
			if (!distube.queues || distube.queues.size === 0) {
				return interaction.update({ content: `**:no_entry_sign: There must be music playing to use that!**`, embeds: [], components: [], ephemeral: true });
			}


			const modal = new ModalBuilder({
				custom_id: 'artistmodal',
				title: 'Artist',
			})

			const artistInput = new TextInputBuilder({
				custom_id: 'artistinput',
				label: 'Artist',
				style: TextInputStyle.Short,
				required: true,
			})

			const artistrow = new ActionRowBuilder().addComponents(artistInput);

			modal.addComponents(artistrow);

			await interaction.showModal(modal);

		} 
	}
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'artistmodal') {
			const artistName = interaction.fields.getTextInputValue('artistinput');
			try {
				// البحث عن أفضل 3 أغاني للفنان
				const searchResults = await ytsr(`${artistName} top songs`, { limit: 10 });

				// فلترة النتائج لتكون فقط من نوع فيديو
				const songUrls = searchResults.items
					.filter(item => item.type === 'video')
					.filter(item => {
						const duration = item.duration.split(':');
						let totalSeconds = 0;

						if (duration.length === 3) {
							const hours = parseInt(duration[0]);
							const minutes = parseInt(duration[1]);
							const seconds = parseInt(duration[2]);
							totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
						} else if (duration.length === 2) {
							const minutes = parseInt(duration[0]);
							const seconds = parseInt(duration[1]);
							totalSeconds = (minutes * 60) + seconds;
						}

						return totalSeconds <= 600; // الأغاني التي مدتها أقل من 10 دقائق
					})
					.slice(0, 3) // جلب أول 3 نتائج فقط
					.map(item => item.url);

				// التحقق من وجود قناة صوتية
				if (!interaction.member.voice.channel) {
					return interaction.reply({ content: '**:no_entry_sign: You must be in a voice channel to play music!**', ephemeral: true });
				}

				// إضافة الأغاني إلى الطابور
				songUrls.forEach(url => {
					// تحقق من وجود metadata في الطابور
					const queue = distube.getQueue(interaction.guild.id);
					if (!queue) {
						// إذا لم توجد قائمة انتظار، أنشئ واحدة
						distube.createQueue(interaction.guild.id);
					}
					if (!queue.metadata) {
						// إذا كانت metadata غير موجودة، أنشئها
						queue.metadata = {};
					}
					if (!queue.metadata.modalSongs) {
						// إذا لم تكن modalSongs موجودة، أنشئها
						queue.metadata.modalSongs = [];
					}

					// إضافة الأغنية إلى modalSongs
					queue.metadata.modalSongs.push(url);

					// تشغيل الأغنية في القناة الصوتية
					distube.play(interaction.member.voice.channel, url, { member: interaction.member });
				});

				// الرد بتأكيد إضافة الأغاني
				return interaction.reply({ content: `> 🎶 Added the **top 3 songs** by **${artistName}** to the queue!`, ephemeral: true });
			} catch (error) {
				console.error(error);
				return interaction.reply({ content: `**:no_entry_sign: Failed to find top songs for artist "${artistName}".**`, ephemeral: true });
			}
		}
	}
});


distube.on("addSong", (queue, song) => {
	try {
		// تحقق من وجود metadata في الطابور
		if (!queue.metadata) {
			queue.metadata = {};  // إذا كانت metadata غير موجودة
		}
		
		// تحقق من وجود modalSongs
		if (!queue.metadata.modalSongs) {
			queue.metadata.modalSongs = [];  // إذا كانت modalSongs غير موجودة
		}

		// التحقق إذا كانت الأغنية من المودال
		const isFromModal = queue.metadata.modalSongs.includes(song.url);

		// إذا كانت الأغنية من المودال، لا يتم إرسال الإمبد
		if (isFromModal) {
			return;  // لا ترسل الـ Embed إذا كانت الأغنية من الـ modal
		}

		// إذا كانت الأغنية ليست من المودال، يتم إرسال الإمبد
		const selectedTrackUrl = queue.metadata?.selectedTrackUrl;

		if (!selectedTrackUrl || song.url !== selectedTrackUrl) {
			queue.textChannel.send({
				embeds: [
					new EmbedBuilder()
						.setColor(config.SecondaryEmbedColor)
						.setAuthor({ name: `${song.user.globalName} - Add a new song`, iconURL: song.user.avatarURL() })
						.setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
						.setDescription(`**[${song.name}](${song.url})**`)
						.setFooter({
							text: `Added by ${song.user.globalName}   |  Duration: [${song.formattedDuration}]`,
							iconURL: song.user.avatarURL(),
						}),
				],
			});
		}
	} catch (err) {
		console.log(err);
	}
});

distube.on("playList", (message, queue, playlist, song) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()

						.setAuthor({ name: `Playling playlist` })
						.setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
						.addFields(
							{
								name: "Playlist:",
								value: `\`${playlist.name}\`  -  \`${playlist.songs.length} songs\``,
								inline: true,
							},
							{
								name: "playing Song:",
								value: `\`${song.name}\`  -  \`${song.formattedDuration}\``,
								inline: true,
							}
						)
						.setFooter({
							text: `Added by  ${song.user.username}`,
							iconURL: song.user.avatarURL(),
						}),
				],
			},
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("addList", (queue, playlist) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()
						.setColor(config.TertiaryEmbedColor)
						.setAuthor({ name: `Playlist Added` })
						.setThumbnail(`https://img.youtube.com/vi/${playlist.id}/mqdefault.jpg`)
						.setAuthor({ name: `${playlist.user.username} - Add a new playlist`, iconURL: playlist.user.avatarURL() })
						.setDescription(`Added [${playlist.name}](${playlist.url}) playlist (${playlist.songs.length}) songs`)
						.setFooter({
							text: `Added by ${playlist.user.username}   |  Duration: [${playlist.formattedDuration}]`,
							iconURL: playlist.user.avatarURL(),
						}),
				],
			},
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("noRelated", (queue) => {
	try {
		console.log("Can't find related video to play.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("error", (message, textChannel, e) => {
	try {
		var embed = new EmbedBuilder()
			.setAuthor({ name: `Error` })
			.setColor("#470000")
			.setDescription(e);
		message.reply({ embeds: [embed] })
	} catch (err) {
		console.log(e);
	}
});

distube.on(`deleteQueue`, (queue) => {
	try {

		var embed = new EmbedBuilder()
			.setAuthor({ name: `Finish Queue` })
			.setColor(config.SecondaryEmbedColor)
			.setDescription(`There are no more songs to play.\nYou can activate \`/autoplay\` so that the queue never ends`)
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					if (queue.songs.length == 0) {
						currentSongPlayMsg.edit({ embeds: [embed], components: [] })
					}
				}, 1000)
			})
	} catch (err) {
		console.log(err);
	}
});

distube.on("finish", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			})
	} catch (err) {
		console.log(err);
	}
});

distube.on('finishSong', (queue, song) => {
	try {
		if (queue.repeatMode === 1) {
			return;
		}

		var embed = new EmbedBuilder()
			.setColor(config.TertiaryEmbedColor)
			.setAuthor({ name: `Finish Song` })
			.setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
			.setDescription(`**[${song.name}](${song.url})**\n`)
			.setFooter({
				text: `Added by ${song.user.username}  |  Duration: [${song.formattedDuration}]`,
				iconURL: song.user.avatarURL(),
			});
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ embeds: [embed], components: [] })
				}, 1000)
			})

	} catch (err) {
		console.log(err);
	}
});




// DisTubeOptions.searchSongs > 1
distube.on("searchResult", (message, result) => {
	try {
		let i = 0;
		message.channel.send({
			embeds: [
				new EmbedBuilder()

					.setDescription(
						`${result
							.map(
								(song) =>
									`**${++i}**. ${song.name} - \`${song.formattedDuration}\``
							)
							.join("\n")}`
					)
					.setFooter({
						text: `Enter anything else or wait 30 seconds to cancel`,
					}),
			],
			content: `Choose an option from below`,
		});
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchCancel", (message) => {
	try {
		message.channel.send("Searching canceled");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchInvalidAnswer", (message) => {
	try {
		message.channel.send("Invalid number of result.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchNoResult", (message) => {
	try {
		message.channel.send("No result found!");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchDone", () => { });





module.exports = distube;
