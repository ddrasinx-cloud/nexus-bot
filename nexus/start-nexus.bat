@echo off
title NEXUS Bot Launcher
color 0B

echo.
echo  ╔══════════════════════════════════════╗
echo  ║         NEXUS - Bot Launcher        ║
echo  ║       Infinite Uptime System        ║
echo  ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0bot"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js not found!
    echo  Download from: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  [*] Installing dependencies...
    call npm install
)

echo  [*] Killing old instances...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo  [*] Starting Nexus bot...
start /B node index.js
echo  [+] Bot started

echo  [*] Starting Cloudflare Tunnel...
start /B powershell -NoProfile -Command "& '%LOCALAPPDATA%\cloudflared\cloudflared.exe' tunnel --url http://127.0.0.1:3000 --protocol http2"
echo  [+] Tunnel started
echo.

echo  ┌──────────────────────────────────────────┐
echo  │  NEXUS is RUNNING                         │
echo  │  Bot: Nexus#4106                          │
echo  │  Local: http://localhost:3000             │
echo  │  Type !status in Discord for tunnel URL   │
echo  └──────────────────────────────────────────┘
echo.
echo  Close this window to stop the bot.
echo.

:loop
timeout /t 10 /nobreak >nul
goto loop
