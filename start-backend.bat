@echo off
REM 启动后端服务
echo 启动后端服务...
cd /d "%~dp0backend"
npm run dev
pause
