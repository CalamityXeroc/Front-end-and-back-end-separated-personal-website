# 🚀 快速上传参考卡

**生成时间：** 2026年3月29日  
**前端文件：** dist.zip (171.42 MB) ✅ 已打包  
**后端文件：** 需要上传 src/ 目录及配置文件  

---

## 📦 你要上传的文件

### 前端（1 个文件）
```
✅ dist.zip  (171.42 MB)
   位置：项目根目录
   用途：前端构建产物，包含所有页面和资源
```

### 后端（目录和文件）
```
✅ backend/src/                          (所有源代码)
✅ backend/package.json                  (依赖列表，可能有新包)
✅ vite.config.js                        (前端构建配置)
✅ package.json                          (前端依赖)
✅ src/                                  (前端源代码)
```

### 不要上传（保留服务器版本）
```
❌ backend/.env                          占用 8 KB（保留！含真实密码）
❌ backend/node_modules/                 占用 200+ MB（run npm install 生成）
❌ backend/uploads/                      占用不定（保留！用户上传的文件）
❌ backend/logs/                         占用不定（保留！运行日志）
❌ node_modules/                         占用 300+ MB（run npm install 生成）
```

---

## ⚡ 三种上传方式

### 方式 1：Git 自动同步（🌟 最推荐）

**优点：** 最简单、最安全、自动处理所有改动

```bash
cd /www/wwwroot/your-project
git pull origin main
```

**一条命令搞定！** ✅

---

### 方式 2：用 SCP 命令（开发者友好）

本地电脑运行（不是服务器）：

```bash
cd e:\BST_lab\my_web\BST-note\my-personal-website

# 上传前端
scp dist.zip user@your-server-ip:/www/wwwroot/your-project/

# 上传后端源代码
scp -r backend/src user@your-server-ip:/www/wwwroot/your-project/backend/
scp -r src user@your-server-ip:/www/wwwroot/your-project/
scp vite.config.js user@your-server-ip:/www/wwwroot/your-project/
scp package.json user@your-server-ip:/www/wwwroot/your-project/
scp backend/package.json user@your-server-ip:/www/wwwroot/your-project/backend/
```

**服务器上：**
```bash
cd /www/wwwroot/your-project
unzip -o dist.zip
npm install
cd backend && npm install
npm run migrate-comments
# 重启
systemctl restart nginx
```

---

### 方式 3：宝塔面板（图形界面）

**前端：**
```
宝塔面板 → 文件 → /www/wwwroot/your-project
1. 上传 dist.zip
2. 右键 → 解压
3. 删除 dist.zip
```

**后端：**
```
宝塔面板 → 文件 → /www/wwwroot/your-project/backend/src
1. 上传新的 src 目录（覆盖旧的）

宝塔面板 → 文件 → /www/wwwroot/your-project
1. 上传 package.json（覆盖）
2. 上传 vite.config.js（覆盖）
```

**终端：**
```
宝塔面板 → 终端 → SSH 终端
cd /www/wwwroot/your-project
unzip -o dist.zip
npm install && cd backend && npm install
npm run migrate-comments
# Node.js 项目 → 重启
```

---

## 📋 上传后的操作（无论哪种方式）

```bash
# 1. 进入项目目录
cd /www/wwwroot/your-project

# 2. 前端解压（如果用上传 zip 的方式）
unzip -o dist.zip

# 3. 安装依赖
npm install
cd backend && npm install

# 4. 迁移数据库（添加新字段）
npm run migrate-comments

# 5. 重启所有服务
systemctl restart nginx

# 宝塔面板 → 软件商店 → Node.js → 重启（项目）
```

---

## ✅ 验证上传成功

```bash
# 1. 检查 dist 目录是否存在
ls -la /www/wwwroot/your-project/dist/
# 应该能看到 index.html 和 assets/

# 2. 检查后端源代码是否更新
ls -la /www/wwwroot/your-project/backend/src/
# 应该能看到新的 server.js

# 3. 检查数据库迁移
psql -h localhost -U postgres -d my_website -c "\d comments"
# 应该看到 parentId 和 likesCount 字段

# 4. 测试后端 API
curl http://localhost:5000/api/blog

# 5. 打开浏览器测试前端
https://your-domain.com/
```

---

## 🎯 建议操作顺序

**最简单（Git 用户）：**
```
1. cd /www/wwwroot/your-project && git pull origin main
2. npm install && cd backend && npm install
3. npm run migrate-comments
4. systemctl restart nginx
5. 宝塔面板重启 Node.js
```

**最直接（不用 Git）：**
```
1. 用 SCP 或宝塔上传 dist.zip、backend/src、package.json 等
2. unzip dist.zip
3. npm install && cd backend && npm install
4. npm run migrate-comments
5. systemctl restart nginx && 宝塔重启 Node.js
```

---

## 📊 文件对比速查

| 项目 | 需要上传 | 大小 | 说明 |
|------|--------|------|------|
| dist.zip | ✅ | 171.42 MB | 前端构建产物 |
| backend/src/ | ✅ | ~1 MB | 后端源代码（新增模型、控制器等） |
| backend/models/CommentLike.js | ✅ | 新文件 | 点赞表模型 |
| backend/scripts/migrateCommentsCompat.js | ✅ | 新文件 | 数据库迁移 |
| vite.config.js | ✅ | 改动 | 代理改为 5000 |
| package.json | ✅ | 改动 | 可能有新依赖 |
| .env | ❌ | 5 KB | 保留服务器版本！ |
| node_modules/ | ❌ | 300+ MB | 运行 npm install |
| uploads/ | ❌ | 不定 | 保留用户文件 |

---

## 🆘 常见问题一句话答

- **Q: 上传后黑屏？** → unzip dist.zip、重启 Nginx、检查 dist/index.html 是否存在
- **Q: API 502？** → 重启 Node.js、检查 .env 是否完整、检查 5000 端口是否监听
- **Q: 数据丢失？** → 不会，数据在数据库，只需运行 npm run migrate-comments 添加字段
- **Q: 能否覆盖 .env？** → 千万别！保留服务器版本，只更新源代码

---

**开始上传吧！** 🚀 选择方式 1（Git）最方便！
