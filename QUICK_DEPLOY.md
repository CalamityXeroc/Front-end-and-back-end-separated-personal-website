# 🚀 上线部署 - 快速参考卡

**生成时间：** 2026年3月29日

---

## 当前配置状态

| 配置项 | 值 | 状态 |
|-------|------|------|
| **后端端口** | 3001 | ✅ 已配置 |
| **前端代理** | http://127.0.0.1:3001 | ✅ 已配置 |
| **NODE_ENV** | production | ✅ 已配置 |
| **数据库** | PostgreSQL localhost:5432 | ✅ 已配置 |
| **上传路径** | ./uploads | ✅ 已配置 |

---

## 🔴 重要：上线前必做

### 1️⃣ **在宝塔面板手动创建 .env 文件**（❌ 不要用 Git 上传）

```bash
# /www/wwwroot/your-project/backend/.env
DB_HOST=your_actual_db_host          # 数据库主机（或 localhost）
DB_PORT=5432                          # PostgreSQL 端口
DB_NAME=my_website                    # 数据库名
DB_USER=your_db_user                  # 数据库用户
DB_PASSWORD=your_secure_password      # 强密码！12+ 字符

PORT=3001
NODE_ENV=production
UPLOAD_PATH=./uploads
TDT_KEY=your_actual_tdt_api_key
```

### 2️⃣ **确认宝塔面板上的 Node.js 配置**

```
宝塔面板 → 软件商店 → Node.js
- 启动端口: 3001 ✅
- 启动文件: backend/src/server.js ✅
- Node 版本: 14+ 或 18+ ✅
```

### 3️⃣ **配置 Nginx 反向代理**

```nginx
# 编辑网站配置
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:3001/uploads/;
}
```

### 4️⃣ **初始化数据库**（首次部署）

```bash
cd /www/wwwroot/your-project
npm install                    # 安装所有依赖
npm run build                  # 前端构建
cd backend && npm run init-db  # 初始化数据库表
```

---

## 🟢 上线后验证

```bash
# 后端 API（应返回博客列表）
curl https://your-domain.com/api/blog

# 前端首页（应加载 Vue 应用）
curl -I https://your-domain.com/

# 评论系统（应返回评论列表）
curl https://your-domain.com/api/comments

# 文件上传测试（宝塔网页上上传一张图片）
```

---

## 🔐 安全清单

- [ ] `.env` 仅在宝塔服务器上创建，不上传 Git
- [ ] 数据库密码使用强密码（12+ 字符，含大小写数字符号）
- [ ] 启用 HTTPS / SSL（宝塔可申请免费 Let's Encrypt）
- [ ] 定期备份数据库（宝塔面板有备份功能）
- [ ] 检查上传目录权限（www 用户可写）

---

## 📂 项目结构（部署版）

```
/www/wwwroot/your-project/
├── backend/
│   ├── src/
│   │   ├── server.js           # 主入口
│   │   ├── config/database.js  # 数据库配置
│   │   ├── routes/             # API 路由
│   │   ├── controllers/         # 业务逻辑
│   │   └── models/             # 数据模型
│   ├── .env                    # ⚠️ 宝塔上手动创建
│   ├── package.json
│   ├── node_modules/           # npm install 自动生成
│   └── uploads/                # 上传文件目录
├── src/                        # Vue 源代码
├── dist/                       # 前端打包产物（npm run build）
├── vite.config.js
├── package.json
└── DEPLOYMENT_GUIDE.md         # 详细部署指南
```

---

## 🆘 故障排查

| 问题 | 排查方法 |
|------|---------|
| **后端 500 错误** | 查看宝塔 Node.js 日志，检查 `.env` 和数据库连接 |
| **前端白屏** | 检查 Nginx 配置，确认 dist/ 生成了 |
| **无法上传文件** | 检查 uploads/ 目录权限（`chown www:www uploads/`）|
| **API 404** | 检查 Nginx `proxy_pass` 是否指向 3001 |
| **无法连接数据库** | 确认 PostgreSQL 在宝塔上启动，`.env` 凭证正确 |

---

## 📞 技术栈

- **前端：** Vue 3 + Vite
- **后端：** Node.js + Express + Sequelize
- **数据库：** PostgreSQL
- **服务器：** 宝塔面板（Nginx + Node.js）
- **上传：** 本地 uploads/ 目录

---

## 参考文档

- 📖 详细部署指南：`DEPLOYMENT_GUIDE.md`
- 🔧 环境变量示例：`backend/.env.example`
- ✅ 快速检查脚本：`check-deployment.sh` 或 `check-deployment.bat`

---

**下一步：** 按照上面的 4 个必做步骤上线，有任何问题查看 `DEPLOYMENT_GUIDE.md`
