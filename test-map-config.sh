#!/bin/bash
# 地图 API 配置诊断脚本
# 用法: bash test-map-config.sh

echo "🔍 正在诊断地图 API 配置..."
echo ""

# 1. 检查 .env 文件
echo "1️⃣  检查 .env 文件配置..."
if [ -f "backend/.env" ]; then
    echo "   ✓ .env 文件存在"
    
    # 检查 TDT_KEY
    if grep -q "TDT_KEY" backend/.env; then
        TDT_VALUE=$(grep "TDT_KEY=" backend/.env | cut -d'=' -f2 | tr -d ' ')
        if [ -z "$TDT_VALUE" ] || [ "$TDT_VALUE" = "your_tianditu_key_here" ]; then
            echo "   ⚠️  TDT_KEY 未配置或为默认值！"
            echo "   📝 需要在 .env 中设置真实的天地图 Key"
        else
            echo "   ✓ TDT_KEY 已配置: ${TDT_VALUE:0:20}..."
        fi
    else
        echo "   ❌ .env 中没有 TDT_KEY 配置！"
    fi
else
    echo "   ❌ .env 文件不存在！"
    echo "   📝 请从 .env.example 复制："
    echo "      cp backend/.env.example backend/.env"
fi

echo ""
echo "2️⃣  检查天地图连接..."

# 检查是否可以连接到天地图（需要已有 TDT_KEY）
if [ -f "backend/.env" ]; then
    TDT_KEY=$(grep "TDT_KEY=" backend/.env | cut -d'=' -f2 | tr -d ' ')
    if [ ! -z "$TDT_KEY" ] && [ "$TDT_KEY" != "your_tianditu_key_here" ]; then
        echo "   正在测试天地图 API..."
        
        # 测试单个瓷砖请求
        TILE_URL="https://t0.tianditu.gov.cn/vec_w/wmts?tk=${TDT_KEY}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL=0&TILEROW=0&TILEMATRIX=0"
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TILE_URL" --max-time 5)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✓ 天地图连接成功 (HTTP $HTTP_CODE)"
        else
            echo "   ❌ 天地图返回错误 (HTTP $HTTP_CODE)"
            echo "   📝 可能原因："
            echo "      • TDT_KEY 无效或过期"
            echo "      • 天地图账户配额已用尽"
            echo "      • 网络连接问题"
        fi
    else
        echo "   ⚠️  TDT_KEY 未配置，无法测试连接"
    fi
else
    echo "   ⚠️  .env 文件不存在，无法测试"
fi

echo ""
echo "3️⃣  检查后端配置..."

# 检查 Node.js 进程
if command -v pm2 &> /dev/null; then
    echo "   检查 PM2 进程状态..."
    if pm2 list | grep -q "my-website-api"; then
        echo "   ✓ 后端服务已启动 (PM2)"
    else
        echo "   ❌ 后端服务未启动"
        echo "   📝 请运行: pm2 start src/server.js --name my-website-api"
    fi
else
    echo "   ℹ️  未检测到 PM2，请手动检查后端是否运行"
fi

echo ""
echo "✅ 诊断完成！"
echo ""
echo "如需帮助，请参考：MAP_DEPLOYMENT_FIX.md"
