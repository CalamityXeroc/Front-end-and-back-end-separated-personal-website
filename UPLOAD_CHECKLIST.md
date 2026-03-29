# 📋 上线上传文件清单

**生成时间：** 2026年3月29日  
**前端构建产物：** dist.zip (171.42 MB)  
**后端版本：** 已修正端口为 5000

---

## 📦 前端文件

### dist.zip (171.42 MB)

**上传位置：** `/www/wwwroot/your-project/dist.zip`  
**操作：** 
1. 上传 dist.zip 到服务器
2. SSH 连接服务器后解压：
   ```bash
   cd /www/wwwroot/your-project
   unzip -o dist.zip
   rm dist.zip
   ```

---

## 🔧 后端文件清单

### ✅ **必须替换的文件**（代码有改动）

```
backend/src/
├── server.js                              ✅ 必须 (端口改为 5000)
├── config/
│   └── database.js                        ✅ 必须 (数据库配置)
├── routes/
│   ├── blogRoutes.js                      ✅ 必须
│   ├── commentRoutes.js                   ✅ 必须 (新增点赞路由)
│   └── uploadRoutes.js                    ✅ 必须
├── controllers/
│   ├── blogController.js                  ✅ 必须
│   ├── commentController.js               ✅ 必须 (新增树形+点赞逻辑)
│   └── (其他 controllers)                 ✅ 必须
├── models/
│   ├── Blog.js                            ✅ 必须
│   ├── Comment.js                         ✅ 必须 (新增 parentId, likesCount)
│   ├── CommentLike.js                     ✅ 必须 (新建，点赞模型)
│   └── (其他 models)                      ✅ 必须
└── scripts/
    └── migrateCommentsCompat.js           ✅ 必须 (数据库迁移脚本)
```

### ❌ **不需要替换的文件**（服务器端特定）

```
backend/
├── .env                                   ❌ 不用替换！
│                                          (已在服务器上，含真实密码)
├── node_modules/                          ❌ 不上传！
│                                          (服务器运行 npm install 生成)
├── uploads/                               ❌ 不覆盖！
│                                          (含用户上传的文件)
├── logs/                                  ❌ 不覆盖！
│                                          (含运行日志)
└── .gitignore                             ✅ 建议更新
```

---

## 📋 完整上传步骤

### 第 1 步：上传前端文件

**方法 A：宝塔文件管理器**
```
宝塔面板 → 文件 → /www/wwwroot/your-project
1. 上传 dist.zip 文件
2. 右键 dist.zip → 解压
3. 删除 dist.zip
```

**方法 B：SSH 命令**
```bash
# 本地电脑运行（不是服务器）
scp dist.zip user@your-server:/www/wwwroot/your-project/

# 或使用 FileZilla、WinSCP 等 FTP 工具上传
```

### 第 2 步：上传后端源代码

**推荐：用 Git 更新**
```bash
cd /www/wwwroot/your-project
git pull origin main
# 自动更新所有改动的源文件
```

**如果不用 Git，手动上传：**

```
上传这些目录（覆盖）：
✅ backend/src/                    (所有源代码)
✅ vite.config.js                  (前端构建配置)
✅ package.json                    (更新依赖列表)

不覆盖这些：
❌ backend/.env                    (保留服务器密钥)
❌ backend/node_modules/           (运行 npm install 生成)
❌ backend/uploads/                (保留用户上传)
❌ backend/logs/                   (保留运行日志)
```

### 第 3 步：安装依赖

```bash
cd /www/wwwroot/your-project
npm install                        # 前端依赖
cd backend
npm install                        # 后端依赖
```

### 第 4 步：数据库迁移

```bash
cd /www/wwwroot/your-project/backend
npm run migrate-comments           # 添加新字段
```

### 第 5 步：重启所有服务

```bash
# 重启前端（如果用 Nginx 需要重载配置）
systemctl restart nginx

# 重启后端 Node.js
# 方法 A：宝塔面板 → Node.js → 项目 → 重启
# 方法 B：kill -9 进程后重启
ps aux | grep node
kill -9 <PID>
cd /www/wwwroot/your-project/backend && npm start
```

---

## 🚀 快速上传命令汇总

### 如果用 Git（推荐）

```bash
# 服务器上执行
cd /www/wwwroot/your-project
git pull origin main               # 更新代码

# 前端
unzip -o dist.zip                  # 解压（如果用上传的方式）

# 后端依赖
cd backend && npm install

# 迁移数据库
npm run migrate-comments

# 重启
systemctl restart nginx
# 宝塔面板重启 Node.js
```

### 如果手动上传

```bash
# 本地电脑
scp -r dist.zip user@server:/www/wwwroot/your-project/
scp -r backend/src user@server:/www/wwwroot/your-project/backend/
scp -r src user@server:/www/wwwroot/your-project/
scp vite.config.js user@server:/www/wwwroot/your-project/
scp package.json user@server:/www/wwwroot/your-project/

# 服务器上
cd /www/wwwroot/your-project
unzip -o dist.zip
cd backend && npm install
npm run migrate-comments
```

---

## 📊 文件对照表

| 文件/目录 | 是否改动 | 需要上传 | 说明 |
|---------|--------|--------|------|
| backend/src/server.js | ✅ | ✅ | 端口改为 5000 |
| backend/src/config/database.js | ✅ | ✅ | 数据库配置 |
| backend/src/controllers/commentController.js | ✅ | ✅ | 新增树形+点赞逻辑 |
| backend/src/models/Comment.js | ✅ | ✅ | 新增 parentId, likesCount |
| backend/src/models/CommentLike.js | ✅ | ✅ | 新建，点赞表模型 |
| backend/src/routes/commentRoutes.js | ✅ | ✅ | 新增点赞路由 |
| backend/src/scripts/migrateCommentsCompat.js | ✅ | ✅ | 新建，数据库迁移 |
| src/components/CommentSection.vue | ✅ | ✅ | 树形评论 UI |
| src/api/index.js | ✅ | ✅ | 新增 like() API |
| vite.config.js | ✅ | ✅ | 代理改为 5000 |
| dist/ | ✅ | ✅ | 前端构建产物 |
| backend/.env | ❌ | ❌ | 保留服务器版本 |
| backend/node_modules/ | N/A | ❌ | 运行 npm install 生成 |
| backend/uploads/ | N/A | ❌ | 保留用户上传文件 |

---

## ⚠️ 注意事项

### 1. 不要覆盖 .env 文件
- 服务器上的 `.env` 含有真实数据库密码
- 本地的 `.env` 只是开发配置
- **上传时跳过 .env**

### 2. 保留 node_modules
- 不要上传 node_modules 目录（太大，1000+ MB）
- 服务器上运行 `npm install` 自动下载

### 3. 保留用户数据
- `backend/uploads/` - 用户上传的文件
- `backend/logs/` - 运行日志
- 数据库中的数据

### 4. 运行 npm install 后再启动
```bash
# 必须先安装依赖
npm install

# 再启动才能加载新的 node 包（如果有新增依赖）
npm start
```

---

## 🎯 最小化上传方案

如果只想更新代码部分（不用 Git）：

```
上传这些文件夹：
📦 backend/src/                    (代码改动最多)
📦 src/                            (前端组件改动)

上传这些文件：
📄 vite.config.js
📄 package.json
📄 dist.zip (解压后)

跳过这些：
backend/.env                       (保留)
backend/node_modules/              (重新 install)
backend/uploads/                   (保留)
backend/logs/                      (保留)
```

---

## 📞 常见问题

**Q: 上传后黑屏？**  
A: 检查 dist 是否正确解压，Nginx 配置是否指向 dist 目录

**Q: API 502 错误？**  
A: 确认后端是否重启，端口是否 5000，`.env` 是否完整

**Q: 评论数据丢失？**  
A: 不会丢失，数据在数据库。只是需要运行 `npm run migrate-comments` 添加新字段

---

**建议：** 用 Git 上传最方便安全！一条命令 `git pull origin main` 搞定 ✅
