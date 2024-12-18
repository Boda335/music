const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const ASCII_TABLE = require('ascii-table');
let table = new ASCII_TABLE(`SlashCommands`);
table.setHeading('Commands', 'Load Status');
table.setBorder('║', '═', '✥', '🌟');
table.setAlign(0, ASCII_TABLE.CENTER);
table.setAlign(1, ASCII_TABLE.CENTER);
table.setAlign(2, ASCII_TABLE.CENTER);
table.setAlign(3, ASCII_TABLE.CENTER);
module.exports = (client) => {
fs.readdirSync('./SlashCommands').forEach((folder) => {
    const commandFiles = fs.readdirSync(`./SlashCommands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
    const command = require(`../SlashCommands/${folder}/${file}`);
    if (command.name) {
        client.slashCommands.set(command.name, command);
        table.addRow(file, '✅');
    } else {
        table.addRow(file, '❌');
        continue;
    }
    }
    });
    const commands = client.slashCommands.map(({ execute, ...data }) => data);
    // Register slash commands
    console.log(table.toString());

}