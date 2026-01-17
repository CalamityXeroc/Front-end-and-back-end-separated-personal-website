@echo off
REM 启动前端服务
echo 启动前端服务...
cd /d "%~dp0"
npm run dev
pause
