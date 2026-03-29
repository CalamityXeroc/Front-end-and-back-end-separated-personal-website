#!/bin/bash
# 服务器端口问题快速诊断和修复脚本
# 用途：检查后端实际监听的端口，并确保与配置一致

echo "========================================="
echo "🔍 服务器后端端口诊断工具"
echo "========================================="
echo ""

# 检查 3001 端口
echo "1️⃣  检查 3001 端口状态..."
if lsof -i :3001 &>/dev/null; then
    echo "✅ 3001 端口已被占用，进程详情："
    lsof -i :3001
else
    echo "❌ 3001 端口未被占用"
fi

echo ""

# 检查 5000 端口
echo "2️⃣  检查 5000 端口状态..."
if lsof -i :5000 &>/dev/null; then
    echo "⚠️  5000 端口被占用（应该停止此进程！）"
    lsof -i :5000
else
    echo "✅ 5000 端口未被占用"
fi

echo ""

# 检查其他常用端口
echo "3️⃣  检查其他 Node.js 常用端口..."
for port in 3000 8000 8080 9000; do
    if lsof -i :$port &>/dev/null; then
        echo "⚠️  端口 $port 已占用：$(lsof -i :$port | grep LISTEN | awk '{print $1, $2}')"
    fi
done

echo ""
echo "4️⃣  检查后端配置..."
if [ -f "backend/.env" ]; then
    echo "✅ .env 文件存在"
    echo "   PORT=$(grep ^PORT= backend/.env | cut -d= -f2)"
    echo "   NODE_ENV=$(grep ^NODE_ENV= backend/.env | cut -d= -f2)"
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "5️⃣  检查 server.js 默认端口..."
if grep -q "PORT || 3001" backend/src/server.js; then
    echo "✅ server.js 默认端口已改为 3001"
else
    echo "❌ server.js 默认端口可能不是 3001"
    grep "PORT ||" backend/src/server.js
fi

echo ""
echo "========================================="
echo "修复建议:"
echo "========================================="
echo ""
echo "如果看到 5000 端口被占用，执行："
echo "  kill -9 \$(lsof -ti :5000)  # 杀死 5000 上的进程"
echo ""
echo "如果 3001 未被占用，执行："
echo "  npm start  # 启动后端"
echo ""
echo "验证后端启动，执行："
echo "  curl http://localhost:3001/api/blog"
echo ""
