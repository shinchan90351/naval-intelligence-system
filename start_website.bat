@echo off
title Naval Intelligence System - Server
echo =======================================================
echo   NAVAL INTELLIGENCE SYSTEM - LOCAL & ONLINE SERVER
echo =======================================================
echo.
echo Starting local web server on port 8080...
start /B python -m http.server 8080
timeout /t 2 >nul
echo.
echo Opening website in your default browser...
start http://localhost:8080/
echo.
echo Starting secure public Cloudflare tunnel...
.\cloudflared.exe tunnel --url http://localhost:8080
pause
