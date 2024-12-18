const fs = require('fs');
const ASCII_TABLE = require('ascii-table');
let table = new ASCII_TABLE(`Commands`);
table.setHeading('Command', 'Load Status');
table.setBorder('║', '═', '✥', '🌟');
table.setAlign(0, ASCII_TABLE.CENTER);
table.setAlign(1, ASCII_TABLE.CENTER);
table.setAlign(2, ASCII_TABLE.CENTER);
table.setAlign(3, ASCII_TABLE.CENTER);

module.exports = (client) => {
    fs.readdirSync('./commands').forEach((folder) => {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (file of commandFiles) {
            let command = require(`../commands/${folder}/${file}`);
            if (command.name) {
                client.commands.set(command.name, command);
                table.addRow(file, '✅');
            } else {
                table.addRow(file, '❌');
                continue;
            }
        }
    });
    console.log(table.toString());
}