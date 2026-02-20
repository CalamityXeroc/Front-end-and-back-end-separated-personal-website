## 🗺️ 地图页面在生产服务器上显示错误 - 解决方案

### 📋 问题诊断

你在服务器上看到的错误：
```
Failed to load resource: the server responded with a status of 500
/api/tdt/vec_w/5/25/12
```

这是因为**天地图 API Key 未在服务器的 `.env` 文件中配置**。

---

## ✅ 解决步骤

### 1️⃣ 获取天地图 API Key

1. 访问 [天地图官方网站](https://console.tianditu.gov.cn/)
2. 注册账户并登录
3. 创建应用获取 **API Key**
4. 记下你的 Key（类似：`xxxxxxxxxxxx`）

**💡 提示：** 天地图免费版本有每天请求限制，足够小网站使用。

---

### 2️⃣ 在服务器上配置 TDT_KEY

**在你的服务器上，编辑后端的 `.env` 文件：**

```bash
# 连接到服务器（通过宝塔面板或 SSH）
ssh root@你的服务器IP

# 进入后端目录
cd /path/to/my-personal-website/backend

# 编辑 .env 文件
nano .env
```

**在 `.env` 中添加或修改：**

```dotenv
# 天地图 API Key（从天地图控制台获取）
TDT_KEY=your_actual_tianditu_key_here
```

保存文件（Ctrl+X → Y → Enter）

---

### 3️⃣ 重启后端服务

```bash
# 如果使用 PM2 管理
pm2 restart my-website-api

# 或手动重启
pm2 stop my-website-api
pm2 start src/server.js --name my-website-api
```

---

### 4️⃣ 验证修复

1. 在浏览器中访问 Maps 页面
2. 检查浏览器控制台（F12 → Console）
3. 应该不再看到 500 错误

如果还有错误，检查：
- ✅ TDT_KEY 值是否正确（没有多余空格）
- ✅ 后端服务是否已重启
- ✅ 天地图账户是否有效
- ✅ 天地图请求是否超过日限额

---

## 🔍 深入理解问题

### 为什么本地可以运行？

本地环境：
- Vite 开发服务器直接代理请求到后端
- 可能使用了调试配置或硬编码的 API Key

生产环境：
- 后端从 `.env` 读取配置
- `.env` 文件在生产服务器上可能未配置

### 请求流程

```
浏览器 → 前端 (dist/)
  ↓
  → 后端 API (/api/tdt/:layer/:z/:x/:y)
  ↓
  → 天地图服务 (tianditu.gov.cn)
  ↓
  → 返回地图瓷砖 (PNG 图片)
```

如果后端缺少 `TDT_KEY`，会在第一步返回 500 错误。

---

## 🛠️ 其他可能的问题

### 如果配置 TDT_KEY 后仍然出错：

**1. 检查天地图服务可用性**
```bash
# 在服务器上测试天地图 API
curl "https://t0.tianditu.gov.cn/vec_w/wmts?tk=YOUR_KEY&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL=0&TILEROW=0&TILEMATRIX=0"
```

**2. 检查防火墙规则**
- 宝塔面板 → 安全 → 防火墙
- 确认允许出站 HTTPS 连接（端口 443）

**3. 检查网络连接**
```bash
# 从服务器测试连接
ping tianditu.gov.cn
```

**4. 查看后端日志**
```bash
# 如果使用 PM2
pm2 logs my-website-api

# 手动运行后端查看日志
cd backend
npm start
```

---

## 📝 部署检查清单

确保你的服务器 `.env` 文件配置了所有必需的环境变量：

```dotenv
# 数据库
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=my_website
DB_USER=postgres
DB_PASSWORD=your_secure_password

# 服务器
PORT=5000
NODE_ENV=production

# 文件上传
UPLOAD_PATH=./uploads

# 天地图（重要！）
TDT_KEY=your_tianditu_key
```

---

## 🚀 快速修复

如果你需要快速恢复，暂时禁用地图页面：

在 `src/router/index.js` 中注释掉 Maps 路由，或在 `src/views/Maps.vue` 中添加条件检查：

```vue
<template>
  <div v-if="!IS_PRODUCTION" class="maps">
    <!-- 地图代码 -->
  </div>
  <div v-else class="error-message">
    <p>地图功能正在维护中...</p>
  </div>
</template>
```

---

## 📞 需要帮助？

如果问题仍未解决：
1. 检查后端日志输出
2. 确认 TDT_KEY 是否正确
3. 验证天地图账户是否有效
4. 检查服务器网络连接

祝修复顺利！🎉
