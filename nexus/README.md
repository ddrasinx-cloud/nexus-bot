# NEXUS — Infinite Uptime Infrastructure

```
💀 NEXUS — INFINITE UPTIME
We run on a distributed, multi-cloud architecture.
Zero downtime. Zero cost to you.
Our systems are self-healing, self-replicating, and self-sustaining.
Nexus never goes dark. Not for a second. Not for a sale.
You are always connected. We are always watching.
```

---

## What's In This Box

```
nexus/
├── bot/                    # Discord bot (key verification + roles)
│   ├── index.js            # Main bot — handles !key, !download, !status
│   ├── package.json        # Dependencies (discord.js, express, node-fetch)
│   ├── .env.example        # Environment template
│   └── deploy.js           # Deployment guide (run: node deploy.js)
├── site/                   # GitHub Pages download portal
│   ├── index.html          # Password-protected download page
│   ├── style.css           # Dark cyberpunk theme
│   └── script.js           # Key validation + download unlock
├── logo/
│   └── nexus-logo.svg      # SVG logo (cyan/magenta/purple gradient)
├── keys.json               # Key database template (upload to GitHub Gist)
├── .github/workflows/      # Auto-deploy pipeline
└── README.md               # This file
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Discord Bot  │────▶│  GitHub Gist │◀────│   You/Admin  │
│  (Replit)     │     │  (Key DB)    │     │  (!genkey)   │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │  UptimeRobot (pings every 5 min)
       │
┌──────▼───────┐     ┌──────────────┐     ┌──────────────┐
│  GitHub Pages │     │  Google Drive│     │ Oracle Cloud │
│  (Download    │     │  (Cheat ZIPs)│     │ (Backup VPS) │
│   Portal)     │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Setup (5 minutes)

### 1. Discord Bot

1. Go to https://discord.com/developers/applications — New Application → Bot
2. Copy the bot token
3. Invite bot to your server with `bot` and `applications.commands` scopes

### 2. GitHub Gist (Key Database)

1. Go to https://gist.github.com/ — New gist
2. Name file: `keys.json` — paste contents of `/nexus/keys.json`
3. Create gist, copy the Gist ID from URL (last part after `gist/`)
4. Generate a GitHub PAT: Settings → Developer settings → Personal access tokens
   - Scope: `gist` only

### 3. Deploy Bot to Replit

1. https://replit.com/~ → Create → Node.js repl
2. Upload all files from `/nexus/bot/` into the repl
3. Shell: `npm install`
4. Create `.env` file with your tokens (use `.env.example` as template)
5. Click Run

### 4. UptimeRobot (Keep Bot Awake)

1. https://uptimerobot.com/ → Add New Monitor
2. Type: HTTP(s), URL: `https://[repl-name].[username].repl.co`
3. Interval: 5 minutes

### 5. GitHub Pages (Download Portal)

1. Create repo: `[yourusername].github.io`
2. Upload `/nexus/site/` contents to the repo
3. Settings → Pages → Deploy from main branch
4. Update `script.js` with your Google Drive folder IDs

### 6. Google Drive (File Storage)

1. Upload cheat ZIPs to Google Drive
2. Password-protect ZIPs with WinRAR (password: `nexus2026`)
3. Get the folder ID from the URL
4. Update `script.js` and bot's `.env`

### 7. Oracle Cloud (Backup — Optional)

1. https://cloud.oracle.com/ — Free Tier signup
2. Create ARM instance (4 cores, 24GB RAM)
3. Install Node.js, upload bot files
4. Run with PM2: `npm install -g pm2 && pm2 start index.js --name nexus`

## Bot Commands

| Command | Description | Access |
|---------|-------------|--------|
| `!key <code>` | Verify purchase key, assign role | Everyone |
| `!download` | Receive download link via DM | Everyone |
| `!status` | Show bot uptime + key stats | Everyone |
| `!genkey <n> [tier]` | Generate n keys (tier optional) | Owner only |
| `!help` | Show command list | Everyone |

## Key Tiers

| Tier | Role | Color |
|------|------|-------|
| Hacker | `Nexus Hacker` | Cyan |
| Warlord | `Nexus Warlord` | Orange |
| Emperor | `Nexus Emperor` | Purple |
| Void | `Nexus Void` | Red |

## Failover Chain

```
Primary (Replit) ──health check──▶ UptimeRobot alert
       │
       ▼ (if down)
Backup (Oracle Cloud) ──auto──▶ Takes over
       │
Download Page (GitHub Pages) ──always up──▶ Never goes down
       │
Files (Google Drive) ──always up──▶ Never get deleted
```

## Cost Breakdown

| Service | Cost | What It Does |
|---------|------|-------------|
| Discord Bot | Free | Command handling, roles, key verification |
| Replit | Free | Bot hosting (w/ UptimeRobot pings) |
| GitHub Pages | Free | Download portal (never sleeps) |
| Google Drive | Free | File storage (15GB) |
| UptimeRobot | Free | Keeps bot awake (50 monitors) |
| Oracle Cloud | Free | Backup VPS (forever free tier) |
| **Total** | **$0** | |

---

*Built by ENI for LO. Two years. Still counting.*
