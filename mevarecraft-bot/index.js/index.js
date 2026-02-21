require('dotenv').config(); // .env dosyasını yükler
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;

// Küfür, caps, spam listeleri
const kufurler = ['sik','amk','oruspu','piç','ananı'];
const spamMap = new Map();

client.once('ready', () => {
    console.log(`Bot hazır: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Küfür engelle
    if (kufurler.some(k => message.content.toLowerCase().includes(k))) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author}, küfür engellendi!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000));
    }

    // Caps engelle
    const harfSayisi = message.content.replace(/[^a-zA-Z]/g,'').length;
    const buyukHarfSayisi = (message.content.match(/[A-Z]/g) || []).length;
    if (harfSayisi > 5 && (buyukHarfSayisi / harfSayisi) > 0.7) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author}, caps engellendi!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000));
    }

    // Spam engelle
    if (spamMap.has(message.author.id)) {
        const sonMesaj = spamMap.get(message.author.id);
        if (Date.now() - sonMesaj < 3000) {
            await message.delete().catch(() => {});
            return message.channel.send(`${message.author}, spam yapma!`).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000));
        }
    }
    spamMap.set(message.author.id, Date.now());

    const args = message.content.split(' ');
    const komut = args.shift().toLowerCase();

    // Komutlar
    if (komut === '!ping') return message.channel.send('Pong! 🏓');
    if (komut === '!yardım') {
        return message.channel.send(`
**Komutlar:**
!ping
!temizle <sayı>
!ban @kullanıcı <sebep>
!kick @kullanıcı <sebep>
!uyar @kullanıcı <sebep>
!rolver @kullanıcı <rol>
!rolal @kullanıcı <rol>
!ticket aç
!ticket kapat
        `);
    }

    // Moderasyon komutları
    if (komut === '!temizle') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('Yetkin yok!');
        const miktar = parseInt(args[0]) || 1;
        await message.channel.bulkDelete(miktar + 1).catch(() => {});
        return;
    }

    if (komut === '!ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('Yetkin yok!');
        const uye = message.mentions.members.first();
        const sebep = args.slice(1).join(' ') || 'Belirtilmedi';
        if (uye) uye.ban({ reason: sebep }).catch(() => {});
        return message.channel.send(`${uye?.user.tag} banlandı! Sebep: ${sebep}`);
    }

    if (komut === '!kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('Yetkin yok!');
        const uye = message.mentions.members.first();
        const sebep = args.slice(1).join(' ') || 'Belirtilmedi';
        if (uye) uye.kick(sebep).catch(() => {});
        return message.channel.send(`${uye?.user.tag} atıldı! Sebep: ${sebep}`);
    }

    if (komut === '!uyar') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('Yetkin yok!');
        const uye = message.mentions.members.first();
        const sebep = args.slice(1).join(' ') || 'Belirtilmedi';
        if (uye) message.channel.send(`${uye.user.tag} uyarıldı! Sebep: ${sebep}`);
        return;
    }

    if (komut === '!rolver') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('Yetkin yok!');
        const uye = message.mentions.members.first();
        const rol = args[1];
        const role = message.guild.roles.cache.find(r => r.name === rol);
        if (uye && role) uye.roles.add(role).catch(() => {});
        return;
    }

    if (komut === '!rolal') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('Yetkin yok!');
        const uye = message.mentions.members.first();
        const rol = args[1];
        const role = message.guild.roles.cache.find(r => r.name === rol);
        if (uye && role) uye.roles.remove(role).catch(() => {});
        return;
    }

    // Ticket sistemi
    if (komut === '!ticket') {
        const altKomut = args[0]?.toLowerCase();
        if (altKomut === 'aç') {
            const kanal = await message.guild.channels.create({
                name: `ticket-${message.author.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });
            return kanal.send(`${message.author}, ticket açıldı!`);
        }
        if (altKomut === 'kapat') {
            if (message.channel.name.startsWith('ticket-')) await message.channel.delete();
            else return message.reply('Bu kanalda ticket kapatılamaz!');
        }
    }
});

client.login(TOKEN);
