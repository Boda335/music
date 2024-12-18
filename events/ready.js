const { ActivityType } = require('discord.js');
const db = require('quick.db');
const distube = require('../client/distube');
const { Utils } = require("devtools-ts");
const {prefix} = require('../config.json');
const red = require("colors")
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    try {
      console.log((`Logged in as ${client.user.tag}`).red);
      console.log((`Servers: ${client.guilds.cache.size}`).magenta, (`Users: ${client.guilds.cache
        .reduce((a, b) => a + b.memberCount, 0)
        .toLocaleString()}`).yellow, (`Commands: ${client.commands.size}`).green);
      client.user.setActivity(`${prefix}help | /help`, { type: ActivityType.Listening }  );
      client.user.setStatus('idle');
      setInterval(async () => {
        client.guilds.cache.forEach(async g => {
          let vch = await db.get(`24_7_${g.id}`)
          if (vch == null) return;
          let ch = client.channels.cache.get(vch);
          if (ch == null) return db.delete(`24_7_${g.id}`)
          const clientMember = g.members.cache.get(client.user.id);
          const checkJoined = clientMember?.voice?.channelId == ch.id;
          if (!checkJoined) {
            console.log(checkJoined)
            try {
              await distube.voices.join(ch)
            } catch (e) {
              console.log("connection", e);
            }
          }
        })
      }, 7000)
    } catch (err) {
      console.log(err)
    }
  }
};