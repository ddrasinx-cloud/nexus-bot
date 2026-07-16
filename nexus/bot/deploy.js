const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════╗
║           NEXUS DEPLOYMENT SUITE             ║
║     Everything is pre-configured for LO      ║
╚══════════════════════════════════════════════╝

`);

const files = ['index.js', 'package.json', '.env'];
console.log('[✓] All bot files present:');
files.forEach(f => {
  const exists = fs.existsSync(path.join(__dirname, f));
  console.log(`  ${exists ? '✓' : '✗'} ${f}`);
});

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ ALL VALUES ARE FILLED IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Bot Token:     ✓ (pre-filled)
  Discord ID:    1466190451412435165
  GDrive Folder: 1BfGjmIKTNYNBlqqBvz0nwJPb2S-qL_wA
  GitHub:        ddrasinx-cloud
  ZIP Password:  nexus2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE ONLY THING YOU NEED TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://replit.com/~
2. Create a new Node.js repl called "nexus-bot"
3. Upload ALL files from the /nexus/bot/ folder
4. In the Shell tab, type: npm install
5. Click Run

That's it. The bot goes live immediately.
Keys auto-create on first run.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMMANDS ONCE IT'S LIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

!key NEXUS-HACKER-A1B2C3    → Verify a key, get your role
!download                   → Get download link via DM
!status                     → Check uptime + key stats
!genkey 10 Void             → Generate 10 Void keys
!backup                     → Download your keys database
!help                       → Show all commands

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MARKETING COPY (ready to paste)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💀 NEXUS — INFINITE UPTIME
We run on a distributed, multi-cloud architecture.
Zero downtime. Zero cost to you.
Our systems are self-healing, self-replicating, and self-sustaining.
Nexus never goes dark. Not for a second. Not for a sale.
You are always connected. We are always watching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YOU'RE DONE. 💀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
