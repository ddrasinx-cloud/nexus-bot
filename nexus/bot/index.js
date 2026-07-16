const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GDRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const ADMIN_PASS = process.env.ADMIN_PASS || 'nexusadmin';
const ZIP_PASSWORD = process.env.ZIP_PASSWORD || 'nexus2026';
const OWNER_ID = process.env.OWNER_ID;
const KEY_WEBHOOK = process.env.KEY_WEBHOOK_URL;

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DURATIONS = ['1d', '3d', '7d', '14d', '30d', '1y', 'Lifetime'];
const DURATION_MAP = { '1d': 1, '3d': 3, '7d': 7, '14d': 14, '30d': 30, '1y': 365, 'Lifetime': -1 };
const DURATION_COLORS = { '1d': 0x00f0ff, '3d': 0x00c8ff, '7d': 0xff6600, '14d': 0xff8800, '30d': 0x7b2ff7, '1y': 0xff0055, 'Lifetime': 0xffd700 };

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {}, users: {}, invites: {}, admins: [OWNER_ID] }, null, 2));
}

const GH_REPO = 'ddrasinx-cloud/nexus-bot';
const GH_PATH = 'bot/data/database.json';
let dbSha = null;

async function syncDown() {
  if (!process.env.CI) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, {
      headers: { Authorization: 'token ' + process.env.GH_TOKEN, Accept: 'application/vnd.github.v3+json' }
    });
    const body = await res.json();
    if (body.content) {
      dbSha = body.sha;
      const decoded = Buffer.from(body.content, 'base64').toString('utf-8');
      fs.writeFileSync(DB_FILE, decoded);
    }
  } catch (e) { console.error('[NEXUS] syncDown failed:', e.message); }
}

async function syncUp() {
  if (!process.env.CI || !process.env.GH_TOKEN) return;
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const encoded = Buffer.from(content).toString('base64');
    const body = { message: 'db sync ' + Date.now(), content: encoded };
    if (dbSha) body.sha = dbSha;
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, {
      method: 'PUT',
      headers: { Authorization: 'token ' + process.env.GH_TOKEN, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const r = await res.json();
    if (r.content) dbSha = r.content.sha;
  } catch (e) { console.error('[NEXUS] syncUp failed:', e.message); }
}

function db() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch { return { keys: {}, users: {}, invites: {}, admins: [OWNER_ID] }; } }
function save(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); if (process.env.CI) syncUp(); }

function genKey() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const lens = [5, 6, 7, 8, 10];
  const len = lens[Math.floor(Math.random() * lens.length)];
  const parts = [];
  for (let i = 0; i < len; i++) parts.push(c[Math.floor(Math.random() * c.length)]);
  const sep = Math.random() > 0.3 ? '-' : '_';
  const splits = [3, 4, 5];
  const split = splits[Math.floor(Math.random() * splits.length)];
  if (parts.length > split) { parts.splice(split, 0, sep); }
  return parts.join('').toUpperCase();
}

function getDurDays(dur) { return DURATION_MAP[dur] !== undefined ? DURATION_MAP[dur] : 1; }
function fmtDur(days) { return days === -1 ? 'Lifetime' : days + ' day' + (days > 1 ? 's' : ''); }
function isExp(exp) { return exp && exp !== -1 && Date.now() > exp; }
function durLabel(dur) { return dur === -1 ? 'Lifetime' : dur + 'd'; }

async function sendWebhook(keys, dur, author) {
  if (!KEY_WEBHOOK) return;
  try {
    await fetch(KEY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'Keys Generated',
          color: 0x00f0ff,
          fields: [
            { name: 'Duration', value: durLabel(dur), inline: true },
            { name: 'Count', value: String(keys.length), inline: true },
            { name: 'By', value: author, inline: true },
            { name: 'Keys', value: keys.map(k => '`' + k + '`').join('\n'), inline: false }
          ],
          footer: { text: 'NEXUS Key System' },
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (e) { console.error('[NEXUS] Webhook error:', e.message); }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers] });
let startTime = Date.now();

client.on('ready', () => {
  console.log(`[NEXUS] Online as ${client.user.tag}`);
  client.user.setPresence({ activities: [{ name: 'NEXUS | !help', type: 3 }], status: 'dnd' });
});

function isAdmin(id) { const d = db(); return d.admins.includes(id) || id === OWNER_ID; }

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const a = msg.content.split(/\s+/);
  const c = a[0].toLowerCase();
  const d = db();
  const isOwner = msg.author.id === OWNER_ID;
  const isAdminUser = isAdmin(msg.author.id);

  try {

  if (c === '!key' && a[1]) {
    const key = a[1].toUpperCase();
    if (!d.keys[key]) return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Invalid Key').setDescription('Key not found.').setColor(0xff0055)] });
    const kd = d.keys[key];
    if (isExp(kd.expiresAt)) return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Expired').setDescription('This key has expired.').setColor(0xff6600)] });
    if (kd.used && kd.discordId && kd.discordId !== msg.author.id) return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Key Used').setDescription('Belongs to another user.').setColor(0xff6600)] });
    kd.used = true; kd.discordId = msg.author.id;
    if (!kd.expiresAt) kd.expiresAt = kd.duration === -1 ? -1 : Date.now() + kd.duration * 86400000;
    d.keys[key] = kd;
    if (!d.users[msg.author.id]) d.users[msg.author.id] = { discordId: msg.author.id, tag: msg.author.tag, email: null, duration: kd.duration, expiresAt: kd.expiresAt, verifiedAt: Date.now() };
    else { d.users[msg.author.id].duration = kd.duration; d.users[msg.author.id].expiresAt = kd.expiresAt; }
    save(d);
    const expiry = kd.expiresAt === -1 ? 'Lifetime' : new Date(kd.expiresAt).toLocaleDateString();
    return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Access Granted').setDescription('Welcome to NEXUS.\n**Duration:** ' + durLabel(kd.duration) + '\n**Expires:** ' + expiry + '\n`!download` for files.').setColor(DURATION_COLORS[kd.duration === -1 ? 'Lifetime' : kd.duration + 'd'] || 0x00f0ff)] });
  }

  if (c === '!download') {
    const dm = await msg.author.createDM();
    return dm.send({ embeds: [new EmbedBuilder().setTitle('Download Access').setDescription('Use `!deliver` to receive your key and download.\n**Password:** `' + ZIP_PASSWORD + '`').setColor(0x00f0ff)] }).then(() => { if (msg.guild) msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Check DMs.').setColor(0x00f0ff)] }); }).catch(() => msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Enable DMs.').setColor(0xff0055)] }));
  }

  if (c === '!status') {
    const u = Math.floor((Date.now() - startTime) / 1000);
    const tk = Object.keys(d.keys).length, uk = Object.values(d.keys).filter(k => k.used).length, uc = Object.keys(d.users).length;
    return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('NEXUS Status').setDescription('**Uptime:** ' + Math.floor(u/86400) + 'd ' + Math.floor((u%86400)/3600) + 'h ' + Math.floor((u%3600)/60) + 'm\n**Keys:** ' + tk + ' total, ' + uk + ' used\n**Users:** ' + uc).setColor(0x00f0ff)] });
  }

  if (c === '!mykeys') {
    const my = Object.entries(d.keys).filter(([, v]) => v.discordId === msg.author.id);
    if (!my.length) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('No keys linked to you.').setColor(0xff6600)] });
    const list = my.map(([k, v]) => '`' + k + '` — ' + durLabel(v.duration)).join('\n');
    return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Your Keys').setDescription(list).setColor(0x00f0ff)] });
  }

  // ADMIN COMMANDS
  if (isAdminUser) {
    if (c === '!users') {
      const ul = Object.values(d.users);
      if (!ul.length) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('No users.').setColor(0xff6600)] });
      const list = ul.map(u => '<@' + u.discordId + '> — ' + durLabel(u.duration) + (u.email ? ' — ' + u.email : '') + (u.isAdmin ? ' 👑' : '')).join('\n');
      if (list.length > 2000) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription(ul.length + ' users total. Use the admin panel.').setColor(0x00f0ff)] });
      return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Users (' + ul.length + ')').setDescription(list).setColor(0x00f0ff)] });
    }

    if (c === '!grant' && a[2]) {
      const target = a[1].replace(/[<@!>]/g, '');
      if (!DURATIONS.includes(a[2])) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Invalid. Options: ' + DURATIONS.join(', ')).setColor(0xff0055)] });
      if (!d.users[target]) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('User not found.').setColor(0xff0055)] });
      const dur = getDurDays(a[2]);
      const expiresAt = dur === -1 ? -1 : Date.now() + dur * 86400000;
      d.users[target].duration = dur; d.users[target].expiresAt = expiresAt;
      const key = genKey();
      d.keys[key] = { duration: dur, used: false, discordId: target, hwid: null, createdAt: Date.now(), expiresAt };
      save(d);
      return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Access Granted').setDescription('<@' + target + '> → ' + durLabel(dur) + '\nKey: `' + key + '`').setColor(0x00f0ff)] });
    }

    if (c === '!revoke' && a[1]) {
      const target = a[1].replace(/[<@!>]/g, '');
      if (!d.users[target]) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('User not found.').setColor(0xff0055)] });
      d.users[target].duration = 0; d.users[target].expiresAt = 0;
      save(d);
      return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Revoked <@' + target + '>').setColor(0xff6600)] });
    }

    if (c === '!genkey' && a[2]) {
      const count = parseInt(a[1]);
      if (isNaN(count) || count < 1) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Usage: `!genkey <count> <duration>`\nDurations: ' + DURATIONS.join(', ')).setColor(0xff0055)] });
      if (!DURATIONS.includes(a[2])) return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Invalid duration. Options: ' + DURATIONS.join(', ')).setColor(0xff0055)] });
      const dur = getDurDays(a[2]);
      const nk = [];
      for (let i = 0; i < Math.min(count, 100); i++) {
        const g = genKey();
        d.keys[g] = { duration: dur, used: false, discordId: null, hwid: null, createdAt: Date.now(), expiresAt: null };
        nk.push(g);
      }
      save(d);
      sendWebhook(nk, dur, msg.author.tag);
      return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Generated ' + count + ' Key(s)').setDescription('Duration: ' + durLabel(dur) + '\n\n' + nk.map(k => '`' + k + '`').join('\n')).setColor(0x00f0ff)] });
    }

    if (c === '!deliver' && a[1] && a[2]) {
      const target = a[1].replace(/[<@!>]/g, '');
      const key = a[2].toUpperCase();
      const dur = d.keys[key] ? durLabel(d.keys[key].duration) : '—';
      msg.channel.send({ embeds: [new EmbedBuilder().setTitle('Thanks for your purchase <@' + target + '>!').setDescription('**Duration:** ' + dur + '\n**Password:** `' + ZIP_PASSWORD + '`').setColor(0x00f0ff).setFooter({ text: 'NEXUS Cheat' }).setTimestamp()] });
      return msg.channel.send('>>> **Your Key:** ||' + key + '||');
    }

    if (c === '!clear') {
      let deleted = 0;
      const bulk = async () => {
        const fetched = await msg.channel.messages.fetch({ limit: 100 });
        if (fetched.size === 0) return;
        const old = fetched.filter(m => Date.now() - m.createdTimestamp < 1209600000);
        if (old.size === 0) return;
        await msg.channel.bulkDelete(old, true);
        deleted += old.size;
        if (fetched.size === 100) await bulk();
      };
      await bulk();
      return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Cleared ' + deleted + ' messages.').setColor(0x00f0ff)] }).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
    }
  }

  // OWNER COMMANDS
  if (isOwner) {
    if (c === '!addadmin' && a[1]) {
      const target = a[1].replace(/[<@!>]/g, '');
      if (!d.admins.includes(target)) d.admins.push(target);
      if (!d.users[target]) d.users[target] = { discordId: target, tag: a[1], email: null, duration: -1, isAdmin: true, verifiedAt: Date.now() };
      else d.users[target].isAdmin = true;
      save(d);
      return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('<@' + target + '> is now admin.').setColor(0x00f0ff)] });
    }
    if (c === '!removeadmin' && a[1]) {
      const target = a[1].replace(/[<@!>]/g, '');
      d.admins = d.admins.filter(id => id !== target);
      if (d.users[target]) d.users[target].isAdmin = false;
      save(d);
      return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('<@' + target + '> removed from admin.').setColor(0xff6600)] });
    }
    if (c === '!backup') {
      return msg.channel.send({ embeds: [new EmbedBuilder().setDescription('Backup attached.').setColor(0x00f0ff)], files: [{ attachment: Buffer.from(JSON.stringify(db(), null, 2), 'utf-8'), name: 'nexus-db-' + Date.now() + '.json' }] });
    }
  }

  if (c === '!help') {
    const tiers = DURATIONS.map(d => '**' + d + '**').join(', ');
    const userCmds = [
      '`!key <code>` — Verify a key',
      '`!download` — Get files via DM',
      '`!mykeys` — List your keys',
      '`!status` — System status',
      '`!help` — This menu'
    ];
    if (isAdminUser) {
      const adminCmds = [
        '`!genkey <count> <duration>` — Generate keys',
        '`!deliver <@user> <key>` — Send thank-you with key & download',
        '`!grant <@user> <duration>` — Grant access',
        '`!revoke <@user>` — Revoke user',
        '`!users` — List users',
        '`!clear` — Clear channel messages'
      ];
      if (isOwner) adminCmds.push('`!addadmin <@user>` — Add admin', '`!removeadmin <@user>` — Remove admin', '`!backup` — Download database');
      return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('NEXUS — Admin').setDescription('**Durations:** ' + tiers + '\n\n**Commands:**\n' + userCmds.concat(adminCmds).join('\n')).setColor(0x00f0ff)] });
    }
    return msg.channel.send({ embeds: [new EmbedBuilder().setTitle('NEXUS').setDescription('**Durations:** ' + tiers + '\n\n**Commands:**\n' + userCmds.join('\n') + '\n\nNeed a key? Contact an admin.').setColor(0x00f0ff)] });
  }

  } catch (e) { console.error('[NEXUS] Command error:', e.message); }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => { const d = db(); res.json({ status: 'online', uptime: Math.floor((Date.now() - startTime) / 1000), keys: Object.keys(d.keys).length, users: Object.keys(d.users).length, durations: DURATIONS }); });

app.post('/api/verify-key-noauth', (req, res) => {
  const { key, hwid } = req.body || {};
  if (!key) return res.json({ valid: false, error: 'No key' });
  const d = db();
  const kd = d.keys[key.toUpperCase()];
  if (!kd) return res.json({ valid: false, error: 'Invalid' });
  if (isExp(kd.expiresAt)) return res.json({ valid: false, error: 'Expired' });
  if (kd.hwid && hwid && kd.hwid !== hwid) return res.json({ valid: false, error: 'HWID mismatch' });
  if (hwid && !kd.hwid) {
    kd.hwid = hwid;
    if (!kd.expiresAt) kd.expiresAt = kd.duration === -1 ? -1 : Date.now() + kd.duration * 86400000;
    save(d);
  }
  return res.json({ valid: true, duration: kd.duration, used: kd.used, hwid: kd.hwid, isLifetime: kd.expiresAt === -1, expiresAt: kd.expiresAt, discord: 'https://discord.gg/qAEg7dPnwg' });
});

app.post('/api/admin/genkeys', (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const { count = 1, duration } = req.body || {};
  if (!DURATIONS.includes(duration)) return res.json({ success: false, error: 'Valid duration required: ' + DURATIONS.join(', ') });
  const d = db();
  const dur = getDurDays(duration);
  const keys = [];
  for (let i = 0; i < Math.min(count, 100); i++) {
    const g = genKey();
    d.keys[g] = { duration: dur, used: false, discordId: null, hwid: null, createdAt: Date.now(), expiresAt: null };
    keys.push(g);
  }
  save(d);
  res.json({ success: true, keys, durationLabel: durLabel(dur) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('[NEXUS] Server on port ' + PORT);
  await syncDown();
  setInterval(syncUp, 60000);
  if (process.env.MAX_RUNTIME_MINUTES) {
    setTimeout(() => { syncUp().then(() => process.exit(0)); }, parseInt(process.env.MAX_RUNTIME_MINUTES) * 60 * 1000);
  }
});
client.login(BOT_TOKEN).catch(e => console.error('[NEXUS] Login failed:', e.message));
