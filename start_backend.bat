@echo off
echo ========================================
echo    个人网站后端 API 启动脚本
echo ========================================
echo.
cd /d "%~dp0backend"

echo [1/2] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    call npm install
)

echo.
echo [2/2] 启动服务器...
echo.
echo 提示：如果遇到数据库连接错误，请先：
echo   1. 确保 PostgreSQL 已启动
echo   2. 在 PostgreSQL 中创建数据库: CREATE DATABASE my_website;
echo   3. 运行: npm run init-db 初始化数据库表
echo.
call npm run dev
pause
