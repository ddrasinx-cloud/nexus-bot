@echo off
title NEXUS Key System
color 0B
echo.
echo  ╔══════════════════════════════════════╗
echo  ║    NEXUS Key System — Desktop App   ║
echo  ║     Standalone Key Verification     ║
echo  ╚══════════════════════════════════════╝
echo.
cd /d "%~dp0"

if exist "keysystem-cs\dist\nexus-keysystem.exe" (
    echo  [*] Launching NEXUS Key System...
    start "NEXUS Key System" "keysystem-cs\dist\nexus-keysystem.exe"
    echo  [+] Key System running
    echo.
    echo  Close this window to stop.
    timeout /t 999999 /nobreak >nul
) else (
    echo  [ERROR] EXE not found at keysystem-cs\dist\nexus-keysystem.exe
    pause
)
