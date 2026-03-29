@echo off
REM 上线前配置检查脚本（Windows 版本）
REM 用途：验证宝塔部署时的端口、环境和依赖配置

setlocal enabledelayedexpansion
chcp 65001 > nul

echo.
echo =========================================
echo 🔍 个人网站上线配置检查工具 (Windows)
echo =========================================
echo.

set PASS=0
set FAIL=0

REM ===== 检查后端配置 =====
echo 1️⃣  检查后端配置...
echo ---

if exist "backend\.env" (
    echo ✅ .env 文件存在
    set /a PASS+=1
    
    findstr /M "NODE_ENV=production" backend\.env > nul
    if !errorlevel! equ 0 (
        echo ✅ NODE_ENV 已设置为 production
        set /a PASS+=1
    ) else (
        echo ❌ NODE_ENV 未设置为 production
        set /a FAIL+=1
    )
    
    findstr /M "PORT=3001" backend\.env > nul
    if !errorlevel! equ 0 (
        echo ✅ 后端端口设置为 3001
        set /a PASS+=1
    ) else (
        echo ⚠️  后端端口设置不是 3001
        set /a FAIL+=1
    )
    
    findstr /M "DB_HOST" backend\.env > nul
    if !errorlevel! equ 0 (
        echo ✅ 数据库配置变量存在
        set /a PASS+=1
    ) else (
        echo ❌ 数据库配置缺失
        set /a FAIL+=1
    )
) else (
    echo ❌ .env 文件不存在
    set /a FAIL+=1
)

echo.
echo 2️⃣  检查依赖...
echo ---

if exist "backend\package.json" (
    echo ✅ backend/package.json 存在
    set /a PASS+=1
    
    findstr /M "\"express\"" backend\package.json > nul
    if !errorlevel! equ 0 (
        echo ✅ Express 依赖已配置
        set /a PASS+=1
    )
    
    findstr /M "\"sequelize\"" backend\package.json > nul
    if !errorlevel! equ 0 (
        echo ✅ Sequelize ORM 依赖已配置
        set /a PASS+=1
    )
) else (
    echo ❌ backend/package.json 缺失
    set /a FAIL+=1
)

if exist "package.json" (
    echo ✅ 前端 package.json 存在
    set /a PASS+=1
    
    findstr /M "\"vue\"" package.json > nul
    if !errorlevel! equ 0 (
        echo ✅ Vue 依赖已配置
        set /a PASS+=1
    )
) else (
    echo ❌ 前端 package.json 缺失
    set /a FAIL+=1
)

echo.
echo 3️⃣  检查源代码文件...
echo ---

setlocal enabledelayedexpansion
for %%F in (
    "backend\src\server.js"
    "backend\src\config\database.js"
    "vite.config.js"
    "src\main.js"
    "src\App.vue"
) do (
    if exist "%%F" (
        echo ✅ %%F
        set /a PASS+=1
    ) else (
        echo ❌ %%F 缺失
        set /a FAIL+=1
    )
)

echo.
echo 4️⃣  检查关键配置...
echo ---

REM 检查 Vite 代理
findstr /M "3001" vite.config.js > nul
if !errorlevel! equ 0 (
    echo ✅ Vite 代理指向端口 3001
    set /a PASS+=1
) else (
    echo ⚠️  Vite 代理配置可能不指向 3001
)

REM 检查 server.js
findstr /M "3001" backend\src\server.js > nul
if !errorlevel! equ 0 (
    echo ✅ server.js 中默认端口配置正确
    set /a PASS+=1
) else (
    echo ⚠️  server.js 中默认端口可能不同
)

echo.
echo =========================================
echo 📊 检查结果汇总
echo =========================================
echo 通过: %PASS% 项
echo 失败: %FAIL% 项
echo.

if %FAIL% equ 0 (
    echo ✅ 所有检查通过！配置已就绪可上线
    echo.
    echo 📋 上线前最后清单：
    echo    [ ] 在宝塔面板创建 backend\.env（使用上述配置）
    echo    [ ] 确认宝塔上 Node.js 启动端口为 3001
    echo    [ ] 运行 npm install（前端和后端）
    echo    [ ] 运行 npm run build（前端）
    echo    [ ] 运行 npm run init-db（初始化数据库）
    echo    [ ] 启动 Node.js 项目
    echo    [ ] 配置 Nginx 反向代理
    echo    [ ] 测试 API 端点
) else (
    echo ❌ 有配置问题，请先修复上述项目
)

echo.
pause
