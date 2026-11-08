@echo off
title Roast & Grow - Web Dev Server
cd /d "%~dp0"
echo ========================================================
echo   [ROAST & GROW] Launching Cyberpunk Web App...
echo ========================================================
echo Launching on fixed port 8081 to preserve local storage data...
call npx.cmd expo start --port 8081 --web
pause
