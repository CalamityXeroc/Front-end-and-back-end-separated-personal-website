# 🚀 上线部署指南

## 前置准备

### 1. 确认配置

**后端环境变量安全清单：**

```bash
# backend/.env（仅部署时在服务器上创建，不上传到 Git）
DB_HOST=your_db_host        # PostgreSQL 数据库主机
DB_PORT=5432                # PostgreSQL 端口
DB_NAME=my_website          # 数据库名
DB_USER=your_db_user        # 数据库用户
DB_PASSWORD=your_secure_pwd # 数据库密码（使用强密码！）

# 服务器配置
PORT=3001                   # 与宝塔面板一致
NODE_ENV=production         # ⚠️ 生产环境必须是 production！

# 文件上传路径
UPLOAD_PATH=./uploads       # 相对路径，宝塔会自动创建

# API Key
TDT_KEY=your_actual_key     # 天地图 API Key
```

**重点：**
- ❌ `.env` 文件永远不要上传到 GitHub
- ✅ 在宝塔面板上手动创建 `.env` 文件
- ✅ 数据库凭证需要是强密码（12+ 字符）

---

## 宝塔面板部署步骤

### 2. 在宝塔上确认实际端口

**方法 A：查看 Node.js 项目管理器**
```
宝塔面板首页 → 软件商店 → Node.js
→ 找到你的项目 → 查看"启动端口"（应该是 3001）
```

**方法 B：查看 Nginx 反向代理配置**
```bash
# 宝塔终端执行
cat /www/server/nginx/conf/vhost/your_domain.com.conf | grep proxy_pass
# 应该看到：proxy_pass http://127.0.0.1:3001;
```

**方法 C：验证进程监听端口**
```bash
# 宝塔终端执行
lsof -i :3001
# 或者
netstat -tlnp | grep node
```

---

### 3. 上传项目文件

使用宝塔文件管理器或 SSH，上传以下内容：

```
✅ 必须上传：
  src/                    # Vue 源代码
  backend/               # Node.js 源代码（不包含 node_modules）
  public/                # 静态资源（GeoJSON、图片等）
  vite.config.js         # Vite 配置
  backend/package.json   # 后端依赖定义
  package.json           # 前端依赖定义

❌ 不要上传：
  node_modules/          # 会自动 npm install
  .git/                  # Git 历史不需要
  .env                   # 敏感信息！在服务器上手动创建
  dist/                  # 可选，宝塔可以自动 npm run build
```

---

### 4. 宝塔上创建 .env 文件

**在宝塔终端：**
```bash
cd /www/wwwroot/your-project/backend
# 使用宝塔文件编辑器或 nano/vim 创建 .env
nano .env
```

**粘贴以下内容（替换实际值）：**
```bash
DB_HOST=localhost           # 如果 PostgreSQL 也在同一服务器
DB_PORT=5432
DB_NAME=my_website
DB_USER=postgres
DB_PASSWORD=your_secure_password_12345

PORT=3001
NODE_ENV=production

UPLOAD_PATH=./uploads
TDT_KEY=7cb53ffa2906c78ebf9b7fe4e63cdff4
```

保存：`Ctrl+X` → `Y` → `Enter`

---

### 5. 配置 Node.js 项目（宝塔 Node.js 管理器）

**如果用宝塔自带的 Node.js 项目管理：**

```
1. 宝塔首页 → 软件商店 → Node.js（新增项目）
2. 项目名称: my-personal-website
3. 项目路径: /www/wwwroot/your-project
4. 启动文件: backend/src/server.js
5. Node 版本: 18.0+（推荐）
6. 启动端口: 3001
7. 启动命令: npm start
8. 点击"新增"和"启动项目"
```

---

### 6. 配置 Nginx 反向代理

**编辑网站配置（宝塔面板 → 网站 → 设置 → 配置文件）：**

```nginx
# 添加这些块到配置文件中

location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:3001/uploads/;
    proxy_set_header Host $host;
}

location / {
    try_files $uri $uri/ /index.html;
    # 前端 SPA 路由配置，确保所有请求都能被 Vue Router 处理
}
```

重启 Nginx：
```bash
# 宝塔终端
systemctl restart nginx
```

---

### 7. 初始化数据库（首次部署）

**如果是全新的 PostgreSQL 数据库，需要初始化：**

```bash
# 宝塔终端，进入项目目录
cd /www/wwwroot/your-project/backend

# 安装依赖
npm install

# 初始化数据库（创建表结构）
npm run init-db

# 如果有老旧评论需要迁移
npm run migrate-comments
```

---

## 部署验证清单

### 8. 上线后测试

**测试 1：后端 API 连接**
```bash
curl https://your-domain.com/api/blog
# 应该返回博客列表 JSON
```

**测试 2：前端加载**
```bash
# 打开浏览器访问
https://your-domain.com/
# 应该看到首页（Vue 应用加载）
```

**测试 3：数据库连接**
```bash
# 查看后端日志（宝塔 Node.js 项目管理器 → 日志）
# 应该看到 "✅ 数据库连接成功！"
```

**测试 4：文件上传**
```bash
# 测试博客图片上传
# 应该返回 /uploads/xxx.jpg 路径
```

**测试 5：评论系统**
```bash
# 访问博客文章，尝试发表评论
# 应该能在数据库中看到新评论
```

---

## 故障排查

### 问题 1：500 错误（后端异常）

**排查步骤：**
```bash
# 查看宝塔 Node.js 日志
tail -f /www/wwwroot/your-project/backend/logs/xxx.log

# 或在宝塔面板查看（Node.js 项目管理器 → 日志）
```

**常见原因：**
- ❌ `.env` 文件不存在或配置错误
- ❌ 数据库凭证错误
- ❌ PostgreSQL 未启动或连接不上
- ❌ 缺少必要的数据库表

**解决：** 检查 `.env`，运行 `npm run init-db`

---

### 问题 2：前端白屏或 404

**排查步骤：**
```bash
# 确认 Nginx 配置
cat /www/server/nginx/conf/vhost/your_domain.com.conf | grep location

# 确认前端是否构建了
ls -la /www/wwwroot/your-project/dist/
```

**常见原因：**
- ❌ Vite 前端未构建
- ❌ Nginx 路由配置错误
- ❌ 前端代理路由指向错误的后端端口

**解决：**
```bash
# 重新构建前端
cd /www/wwwroot/your-project
npm run build

# 确认 dist/ 生成了
ls dist/index.html  # 应该存在
```

---

### 问题 3：上传文件找不到

**排查步骤：**
```bash
# 检查上传目录权限
ls -la /www/wwwroot/your-project/backend/uploads/

# 给 www 用户写权限
chown -R www:www /www/wwwroot/your-project/backend/uploads/
chmod -R 755 /www/wwwroot/your-project/backend/uploads/
```

---

## 性能优化建议

1. **启用 HTTPS**
   ```bash
   # 宝塔面板 → 网站 → SSL → Let's Encrypt 免费证书
   ```

2. **启用 Gzip 压缩**（Nginx 配置已默认）

3. **数据库连接池** 
   ```bash
   # backend/src/config/database.js 已配置 Sequelize 连接池
   # max: 5, min: 0 - 根据流量调整
   ```

4. **静态资源 CDN**
   ```bash
   # public/ 下的文件可以接入 CDN（可选）
   ```

---

## 安全建议

1. ✅ 使用强数据库密码（12+ 字符，含大小写数字符号）
2. ✅ `.env` 仅在服务器上创建，不上传 Git
3. ✅ 定期备份数据库
4. ✅ 启用 HTTPS / SSL
5. ✅ 限制上传文件大小（已配置 50MB）
6. ✅ 定期更新 Node.js 依赖包

```bash
# 检查已知漏洞
npm audit
npm audit fix  # 自动修复
```

---

## 宝塔面板常用命令

```bash
# 查看 Node.js 进程
ps aux | grep node

# 查看端口占用
netstat -tlnp | grep 3001

# 查看系统日志
tailf /var/log/messages

# 重启 Node.js 项目
# （通过宝塔面板 Node.js 管理器操作更方便）

# SSH 连接宝塔
# 根据宝塔提供的 SSH 端口和密钥
```

---

## 后续维护

- **监控后端日志**：宝塔面板 → Node.js 项目管理器 → 日志
- **数据库备份**：宝塔面板 → 数据库 → 备份（建议每周）
- **依赖更新**：定期运行 `npm outdated` 检查更新
- **性能监控**：宝塔面板 → 服务器 → 实时监控

---

有任何部署问题，检查这个清单：
- [ ] PORT=3001 与宝塔配置一致
- [ ] NODE_ENV=production
- [ ] .env 文件在服务器上存在且凭证正确
- [ ] 数据库已初始化（npm run init-db）
- [ ] Nginx 反向代理配置正确
- [ ] 后端已启动（宝塔面板可见）
- [ ] 前端已构建（dist/ 存在）
