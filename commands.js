const commands = {
    halo: msg => msg.reply('halo juga'),
    waktu: msg => msg.reply(new Date().toLocaleString()),
    ulang: msg => msg.reply(msg.body)
};

module.exports = commands;