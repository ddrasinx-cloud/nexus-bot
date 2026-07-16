const express = require('express');
const http = require('http');

const PORT = 3001;
const API_PORT = 3000;
const app = express();
let server = null;

const GRAY = '\x1b[90m', CYAN = '\x1b[36m', PURPLE = '\x1b[35m', GREEN = '\x1b[32m', RED = '\x1b[31m', RESET = '\x1b[0m';

console.log(`${GRAY}╔══════════════════════════════════════╗${RESET}`);
console.log(`${GRAY}║${RESET} ${CYAN}  NEXUS Key System — Desktop Client ${RESET} ${GRAY}║${RESET}`);
console.log(`${GRAY}║${RESET} ${PURPLE}  Standalone Key Verification Tool   ${RESET} ${GRAY}║${RESET}`);
console.log(`${GRAY}╚══════════════════════════════════════╝${RESET}`);
console.log('');

function getApiBase() {
  if (process.env.NEXUS_API_URL) return process.env.NEXUS_API_URL;
  try {
    const configPath = require('path').join(__dirname, 'api-url.txt');
    const url = require('fs').readFileSync(configPath, 'utf-8').trim();
    if (url) return url;
  } catch {}
  return `http://127.0.0.1:${API_PORT}`;
}

function checkApi() {
  return new Promise((resolve) => {
    const req = http.get(`${getApiBase()}/health`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>NEXUS Key System</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'JetBrains Mono',monospace;background:#1a1a2e;color:#c0c0c0;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.window{background:#252540;border:1px solid #3a3a5c;border-radius:8px;width:540px;box-shadow:0 0 40px rgba(0,0,0,0.5);overflow:hidden}
.titlebar{background:#1e1e38;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #3a3a5c;font-size:13px;letter-spacing:1px;color:#8888aa;cursor:default}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block}
.dot.r{background:#ff5f57}.dot.y{background:#ffbd2e}.dot.g{background:#28c840}
.content{padding:24px}
.tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid #3a3a5c}
.tab{padding:10px 20px;font-size:12px;color:#8888aa;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;text-transform:uppercase;letter-spacing:1px}
.tab:hover{color:#c0c0c0}.tab.active{color:#00f0ff;border-bottom-color:#00f0ff}
.panel{background:#1e1e38;border:1px solid #3a3a5c;border-radius:6px;padding:20px;margin-bottom:16px}
.panel-title{font-size:11px;color:#8888aa;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.input-group{display:flex;gap:8px;margin-bottom:12px}
.input-group input{flex:1;background:#1a1a2e;border:1px solid #3a3a5c;border-radius:4px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:14px;color:#c0c0c0;outline:none;transition:border-color 0.2s}
.input-group input:focus{border-color:#00f0ff}.btn{background:linear-gradient(135deg,#00f0ff,#7b2ff7);border:none;border-radius:4px;padding:10px 20px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#0a0a0f;cursor:pointer;transition:opacity 0.2s;text-transform:uppercase;letter-spacing:1px}
.btn:hover{opacity:0.85}.status-line{padding:8px 12px;border-radius:4px;font-size:12px;margin-top:12px}
.status-line.success{background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);color:#00f0ff}
.status-line.error{background:rgba(255,0,85,0.1);border:1px solid rgba(255,0,85,0.2);color:#ff0055}
.status-line.info{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#8888aa}
.hidden{display:none}.key-display{background:#1a1a2e;border:1px solid #3a3a5c;border-radius:4px;padding:10px 14px;font-size:14px;color:#00f0ff;margin:8px 0;word-break:break-all;text-align:center;letter-spacing:2px}
.glow{animation:glow 2s ease-in-out infinite alternate}
@keyframes glow{from{box-shadow:0 0 5px rgba(0,240,255,0.2)}to{box-shadow:0 0 20px rgba(0,240,255,0.4)}}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px}
.info-grid .label{color:#8888aa}.info-grid .value{color:#c0c0c0;font-weight:600}
.conn-status{text-align:center;padding:6px;font-size:11px;letter-spacing:1px;border-top:1px solid #3a3a5c;color:#555}
.progress-bar{height:4px;background:#3a3a5c;border-radius:2px;margin-top:16px;overflow:hidden}
.progress-bar .fill{height:100%;background:linear-gradient(90deg,#00f0ff,#7b2ff7);width:0%;transition:width 0.5s;border-radius:2px}
</style>
</head><body>
<div class="window">
<div class="titlebar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="title-text">NEXUS Key System v1.0</span></div>
<div class="content">
<div style="text-align:center;margin-bottom:16px;font-size:28px;font-weight:700;letter-spacing:6px;background:linear-gradient(135deg,#00f0ff,#7b2ff7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">NEXUS</div>
<div class="panel">
<div class="panel-title">🔑 ENTER LICENSE KEY</div>
<div class="input-group"><input type="text" id="keyInput" placeholder="NEXUS-HACKER-XXXXXX" onkeydown="if(event.key==='Enter')v()"><button class="btn" onclick="v()">VERIFY</button></div>
<div class="progress-bar"><div class="fill" id="prog"></div></div>
</div>
<div id="rp" class="hidden panel"><div class="panel-title" id="rt">RESULT</div><div id="rc"></div></div>
<div id="sl" class="status-line info">Enter a key to verify.</div>
<div id="cstat" class="conn-status">● Connecting to API...</div>
</div></div>
<script>
const API='${getApiBase()}';
async function v(){
const k=document.getElementById('keyInput').value.trim();if(!k)return;
document.getElementById('prog').style.width='50%';
document.getElementById('sl').textContent='Verifying...';document.getElementById('sl').className='status-line info';
try{
const r=await fetch(API+'/api/verify-key-noauth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})});
const d=await r.json();document.getElementById('prog').style.width='100%';setTimeout(()=>document.getElementById('prog').style.width='0%',800);
document.getElementById('rp').classList.remove('hidden');
if(d.valid){
document.getElementById('rt').textContent='✅ VALID KEY';
const c=d.tier==='Hacker'?'#00f0ff':d.tier==='Warlord'?'#ff6600':d.tier==='Emperor'?'#7b2ff7':'#ff0055';
document.getElementById('rc').innerHTML='<div class="key-display glow" style="border-color:'+c+'">'+k+'</div><div class="info-grid" style="margin-top:12px"><div class="label">Tier</div><div class="value" style="color:'+c+'">'+d.tier+'</div><div class="label">Status</div><div class="value" style="color:'+(d.used?'#ff6600':'#00f0ff')+'">'+(d.used?'USED':'ACTIVE')+'</div></div>';
document.getElementById('sl').textContent='✅ Key valid — '+d.tier+' tier';document.getElementById('sl').className='status-line success';
}else{
document.getElementById('rt').textContent='❌ INVALID KEY';
document.getElementById('rc').innerHTML='<div style="color:#ff0055;text-align:center;padding:8px">'+(d.error||'Key not found')+'</div>';
document.getElementById('sl').textContent='❌ Invalid key';document.getElementById('sl').className='status-line error';
}
}catch(e){
document.getElementById('prog').style.width='0%';
document.getElementById('sl').textContent='Connection error';document.getElementById('sl').className='status-line error';
}}
(async function(){try{const r=await fetch(API+'/health');const d=await r.json();document.getElementById('cstat').innerHTML='● Connected — '+d.keys+' keys, '+d.users+' users';document.getElementById('cstat').style.color='#00f0ff'}catch{document.getElementById('cstat').textContent='● API offline — start Nexus bot';document.getElementById('cstat').style.color='#ff0055'}})();
</script>
</body></html>`);
});

server = app.listen(PORT, () => {
  console.log(` ${GREEN}✓${RESET} Key System running at ${CYAN}http://127.0.0.1:${PORT}${RESET}`);
  console.log(` ${GRAY}— Press Ctrl+C to exit${RESET}`);
  console.log('');

  checkApi().then(status => {
    if (status) {
      console.log(` ${GREEN}✓${RESET} Nexus API connected — ${status.keys} keys, ${status.users} users`);
    } else {
      console.log(` ${RED}⚠${RESET} Nexus API not reachable on port ${API_PORT}`);
      console.log(` ${GRAY}  Start the bot first: cd ../bot && node index.js${RESET}`);
    }
  });

  const url = `http://127.0.0.1:${PORT}`;
  try {
    const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
    require('child_process').exec(start + ' ' + url);
  } catch {}
});

process.on('SIGINT', () => { if (server) server.close(); process.exit(); });
process.on('SIGTERM', () => { if (server) server.close(); process.exit(); });
