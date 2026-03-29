#!/bin/bash
# 上线前配置检查脚本
# 用途：验证宝塔部署时的端口、环境和依赖配置

echo "========================================="
echo "🔍 个人网站上线配置检查工具"
echo "========================================="
echo ""

# 色彩定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0

echo "1️⃣  检查后端配置..."
echo "---"

# 检查 .env 文件
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅${NC} .env 文件存在"
    ((PASS++))
    
    # 检查关键变量
    if grep -q "NODE_ENV=production" backend/.env; then
        echo -e "${GREEN}✅${NC} NODE_ENV 已设置为 production"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} NODE_ENV 未设置为 production（当前：$(grep NODE_ENV backend/.env)）"
        ((FAIL++))
    fi
    
    if grep -q "PORT=3001" backend/.env; then
        echo -e "${GREEN}✅${NC} 后端端口设置为 3001"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠️${NC}  后端端口设置：$(grep PORT backend/.env)"
        ((FAIL++))
    fi
    
    if grep -q "DB_HOST" backend/.env && grep -q "DB_NAME" backend/.env; then
        echo -e "${GREEN}✅${NC} 数据库配置变量存在"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} 数据库配置缺失"
        ((FAIL++))
    fi
    
else
    echo -e "${RED}❌${NC} .env 文件不存在"
    ((FAIL++))
fi

echo ""
echo "2️⃣  检查依赖..."
echo "---"

if [ -f "backend/package.json" ]; then
    echo -e "${GREEN}✅${NC} backend/package.json 存在"
    ((PASS++))
    
    if grep -q "\"express\"" backend/package.json; then
        echo -e "${GREEN}✅${NC} Express 依赖已配置"
        ((PASS++))
    fi
    
    if grep -q "\"sequelize\"" backend/package.json; then
        echo -e "${GREEN}✅${NC} Sequelize ORM 依赖已配置"
        ((PASS++))
    fi
else
    echo -e "${RED}❌${NC} backend/package.json 缺失"
    ((FAIL++))
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅${NC} 前端 package.json 存在"
    ((PASS++))
    
    if grep -q "\"vue\"" package.json; then
        echo -e "${GREEN}✅${NC} Vue 依赖已配置"
        ((PASS++))
    fi
else
    echo -e "${RED}❌${NC} 前端 package.json 缺失"
    ((FAIL++))
fi

echo ""
echo "3️⃣  检查源代码文件..."
echo "---"

files=(
    "backend/src/server.js"
    "backend/src/config/database.js"
    "vite.config.js"
    "src/main.js"
    "src/App.vue"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $file 缺失"
        ((FAIL++))
    fi
done

echo ""
echo "4️⃣  检查关键配置..."
echo "---"

# 检查 Vite 代理是否指向 3001
if grep -q "3001" vite.config.js; then
    echo -e "${GREEN}✅${NC} Vite 代理指向端口 3001"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️${NC}  Vite 代理配置可能不指向 3001"
    ((FAIL++))
fi

# 检查 server.js 中的端口
if grep -q "3001" backend/src/server.js; then
    echo -e "${GREEN}✅${NC} server.js 中默认端口与 .env 一致"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️${NC}  server.js 中默认端口可能不同"
    ((FAIL++))
fi

echo ""
echo "========================================="
echo "📊 检查结果汇总"
echo "========================================="
echo -e "${GREEN}通过: $PASS 项${NC}"
echo -e "${RED}失败: $FAIL 项${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！配置已就绪可上线${NC}"
    echo ""
    echo "📋 上线前最后清单："
    echo "   [ ] 在宝塔面板创建 backend/.env（使用上述配置）"
    echo "   [ ] 确认宝塔上 Node.js 启动端口为 3001"
    echo "   [ ] 运行 npm install（前端和后端）"
    echo "   [ ] 运行 npm run build（前端）"
    echo "   [ ] 运行 npm run init-db（初始化数据库）"
    echo "   [ ] 启动 Node.js 项目"
    echo "   [ ] 配置 Nginx 反向代理"
    echo "   [ ] 测试 API 端点"
    exit 0
else
    echo -e "${RED}❌ 有配置问题，请先修复上述项目${NC}"
    exit 1
fi
