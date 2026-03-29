# ✅ 上线前最终检查清单

**最后更新：** 2026年3月29日  
**状态：** 准备上线  
**配置端口：** 5000（与线上服务器一致）

---

## 📋 核心配置验证

### ✅ 已确认的配置

| 配置项 | 本地值 | 线上值 | 状态 |
|-------|--------|--------|------|
| **后端监听端口** | 5000 | 5000 | ✅ 一致 |
| **前端代理端口** | 5000 | 5000 | ✅ 一致 |
| **NODE_ENV** | production | production | ✅ 一致 |
| **数据库类型** | PostgreSQL | PostgreSQL | ✅ 一致 |
| **上传路径** | ./uploads | ./uploads | ✅ 一致 |

---

## 🔍 需要排查的 12 个检查点

### 1. **数据库表结构兼容性** ⚠️

**需要检查：**
```bash
□ Comment 表是否有新字段？
  - parentId (整数，允许 NULL - 评论树功能)
  - likesCount (整数，默认 0 - 点赞计数)
  
□ CommentLike 表是否存在？
  - 用于存储谁点赞过哪条评论
  - 防止重复点赞
```

**快速检查命令（线上服务器）：**
```bash
psql -h localhost -U postgres -d my_website -c "\d comments"
# 必须能看到：id, content, nickname, blogId, parentId, likesCount, createdAt, updatedAt

psql -h localhost -U postgres -d my_website -c "\d comment_likes"
# 必须能看到：id, commentId, visitorKey, createdAt
```

**如果表结构不对，需要运行迁移：**
```bash
cd /www/wwwroot/your-project/backend
npm run init-db              # 初始化所有表
npm run migrate-comments     # 迁移评论数据兼容性
```

---

### 2. **前端构建产物是否完整** ⚠️

**需要检查：**
```bash
□ dist/ 目录是否存在？
□ dist/index.html 文件是否存在？
□ dist/assets/ 下是否有 JS 和 CSS 文件？
```

**本地测试命令：**
```bash
npm run build
# 应该看到：
# ✓ 251 modules transformed
# dist/index.html                  0.43 KiB
# dist/assets/index.xxx.css        120+ KiB
# dist/assets/index.xxx.js         2000+ KiB
```

**线上验证：**
```bash
cd /www/wwwroot/your-project
ls -la dist/
du -sh dist/
# dist 目录应该 > 2MB
```

---

### 3. **Nginx 代理配置是否正确** ⚠️

**需要检查：**
```bash
□ /api 是否代理到 http://127.0.0.1:5000/api？
□ /uploads 是否代理到 http://127.0.0.1:5000/uploads？
□ / 是否正确指向前端 dist/ 目录？
```

**查看实际配置：**
```bash
cat /www/server/nginx/conf/vhost/your-domain.com.conf | grep -A 5 "location"
```

**应该包含这些块：**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:5000/uploads/;
}

location / {
    try_files $uri $uri/ /index.html;
    # Vue SPA 路由配置
}
```

---

### 4. **上传目录权限是否正确** ⚠️

**需要检查：**
```bash
□ /www/wwwroot/your-project/backend/uploads/ 是否存在？
□ www 用户是否有写权限？
```

**修复权限：**
```bash
# 如果目录不存在，创建
mkdir -p /www/wwwroot/your-project/backend/uploads

# 给 www 用户所有权和读写权限
chown -R www:www /www/wwwroot/your-project/backend/uploads/
chmod -R 755 /www/wwwroot/your-project/backend/uploads/
```

---

### 5. **环境变量配置是否完整** ⚠️

**线上 .env 必须包含：**
```bash
# 数据库配置（替换为真实值）
DB_HOST=localhost           # 或你的 RDS 主机
DB_PORT=5432
DB_NAME=my_website
DB_USER=postgres
DB_PASSWORD=your_strong_password

# 服务器配置
PORT=5000
NODE_ENV=production
UPLOAD_PATH=./uploads

# API Key
TDT_KEY=7cb53ffa2906c78ebf9b7fe4e63cdff4
```

**验证：**
```bash
cat /www/wwwroot/your-project/backend/.env
# 应该能看到所有这些变量都已设置
```

---

### 6. **Node.js 应用依赖是否安装** ⚠️

**后端依赖：**
```bash
cd /www/wwwroot/your-project/backend
npm install
npm list express sequelize pg
# 应该都显示版本号，没有错误
```

**前端依赖：**
```bash
cd /www/wwwroot/your-project
npm install
npm list vue vite axios
# 应该都显示版本号，没有错误
```

---

### 7. **PostgreSQL 数据库是否运行** ⚠️

**检查数据库状态：**
```bash
systemctl status postgresql
# 应该显示 active (running)

# 尝试连接
psql -h localhost -U postgres -d my_website -c "SELECT 1;"
# 应该返回 " 1"（成功）
```

---

### 8. **后端 Node.js 进程是否运行** ⚠️

**检查进程：**
```bash
# 查看是否有 node 进程
ps aux | grep node
# 或通过端口查看
lsof -i :5000
# 应该看到 node 进程监听 5000 端口
```

**通过宝塔面板检查：**
```
宝塔面板 → 软件商店 → Node.js
→ 找你的项目 → 状态应该是"运行中"
```

---

### 9. **后端 API 是否可访问** ⚠️

**测试 API 端点：**
```bash
# 测试博客 API
curl http://localhost:5000/api/blog
# 应该返回 JSON 数组

# 测试评论 API
curl http://localhost:5000/api/comments
# 应该返回 JSON

# 通过 Nginx 代理测试
curl https://your-domain.com/api/blog
# 应该返回同样的 JSON

# 测试上传目录
curl https://your-domain.com/uploads/
# 应该能访问（可能 403 但不是 502）
```

---

### 10. **前端是否正常加载** ⚠️

**用浏览器测试：**
```
打开 https://your-domain.com/

检查：
□ 页面是否正常显示？
□ 没有白屏？
□ CSS 样式是否正确加载？
□ 开发者工具 → Console 是否有红色错误？
```

**检查网络请求：**
```
按 F12 → Network 标签
□ /api/blog 是否返回 200？
□ /api/comments 是否返回 200？
□ 其他 API 是否都是 200？
□ 有没有 502 Bad Gateway？
□ 有没有 404 Not Found？
```

---

### 11. **评论系统是否正常工作** ⚠️

**测试步骤：**
```
1. 打开一篇博客文章
   https://your-domain.com/blog/any-article

2. 查看评论是否加载
   应该看到评论列表（如果有旧评论）

3. 测试发表新评论
   输入昵称 → 输入评论内容 → 点发送
   应该看到新评论立即出现

4. 测试点赞功能
   点击🤍图标 → 应该变成❤️
   点赞数应该增加

5. 测试回复功能
   点击某条评论的"回复" → 应该出现回复表单
   输入回复内容 → 应该缩进显示

6. 刷新页面
   评论应该仍然存在（数据已保存）
```

---

### 12. **地图功能是否正常** ⚠️

**如果有地图功能：**
```
打开 https://your-domain.com/maps

检查：
□ 地图是否加载？
□ 是否能缩放和拖拽？
□ 地理数据是否正确显示？
□ 开发者工具是否有 Mapbox 相关错误？
```

---

## 📝 上线前步骤总结

### 本地（你的电脑）：第 1-2 步
```bash
# 1. 构建前端
npm run build

# 2. 验证构建成功
ls dist/index.html
```

### 线上（宝塔服务器）：第 3-7 步

```bash
# 3. 上传代码
# 用宝塔文件管理器上传或用 git pull

# 4. 安装依赖
cd /www/wwwroot/your-project
npm install                    # 前端依赖
cd backend
npm install                    # 后端依赖

# 5. 初始化数据库
npm run init-db               # 创建表
npm run migrate-comments      # 迁移评论数据（如果有老数据）

# 6. 构建前端（如果远程需要）
cd ..
npm run build

# 7. 启动 Node.js（通过宝塔面板或命令行）
# 推荐用宝塔面板启动
```

### 验证（第 8-12 步）

```bash
# 8. 测试后端
curl http://localhost:5000/api/blog

# 9. 测试前端
打开浏览器访问 https://your-domain.com

# 10. 测试评论
发表评论、点赞、回复

# 11. 查看日志排查问题
tail -f /www/server/nginx/logs/error.log
tail -f /www/wwwroot/your-project/backend/logs/xxx.log
```

---

## 🚨 常见问题快速排查

| 问题 | 第一检查 | 第二检查 | 第三检查 |
|------|----------|---------|----------|
| **前端白屏** | dist/ 存在？ | Nginx 指向 dist/？ | Console 有错误？ |
| **API 502** | 后端在运行？ | 监听 5000？ | Nginx 代理正确？ |
| **数据库错误** | PostgreSQL 启动？ | .env 凭证对？ | 数据库存在？ |
| **评论不显示** | 表结构对？ | 数据库有数据？ | API 返回正确？ |
| **文件上传失败** | 目录权限对？ | 磁盘有空间？ | 路径正确？ |

---

## 📞 如果仍有问题

1. **查看后端日志**
   ```bash
   宝塔 → Node.js → 项目 → 日志
   ```

2. **查看 Nginx 日志**
   ```bash
   tail -f /www/server/nginx/logs/error.log
   ```

3. **检查连接**
   ```bash
   # 数据库
   psql -h localhost -U postgres -d my_website -c "SELECT 1;"
   
   # 后端
   curl http://localhost:5000/
   
   # 代理
   curl https://your-domain.com/api/blog
   ```

4. **检查进程**
   ```bash
   ps aux | grep node
   systemctl status postgresql
   systemctl status nginx
   ```

---

**总结：** 按照上面的 12 个检查点，配合上下 7 个步骤，就能确保上线成功！

最重要的是：**本地配置（5000）和线上配置（5000）现在完全一致了** ✅
