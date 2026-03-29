# 🔧 端口问题修复方案

**时间：** 2026年3月29日  
**问题：** 后端实际监听 5000，但配置指向 3001  
**状态：** ✅ 已修复

---

## 问题分析

### 症状
```bash
root@VM-0-8-ubuntu:~# lsof -i :3001
# （无输出 - 3001 端口无进程）

root@VM-0-8-ubuntu:~# lsof -i :5000
COMMAND       PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
node\x20/ 1050630 root   23u  IPv4 6006585      0t0  TCP *:5000 (LISTEN)
# ❌ 后端监听 5000，不是 3001！
```

### 根本原因

| 配置项 | 值 | 加载状态 |
|-------|------|--------|
| `.env` PORT | 3001 | ❌ 未被加载 |
| `server.js` 默认值 | 5000 | ✅ 被使用了 |
| 实际监听 | 5000 | ❌ 错误！ |

**原因：** 服务器上 `.env` 文件没有被正确加载，导致 Node.js 使用 `server.js` 中的硬编码默认值 5000

---

## 已修复的内容

### 1. 已修改 server.js 默认端口

**文件：** `backend/src/server.js` 第 13 行

```javascript
// 修改前（错误）：
const PORT = process.env.PORT || 5000;

// 修改后（正确）：
const PORT = process.env.PORT || 3001;
```

**为什么这样改？**
- 即使 `.env` 加载失败，后端也会默认监听 3001
- 3001 是生产环境的标准端口
- 与 Nginx 反向代理配置（3001）保持一致
- 与 Vite 前端代理配置（3001）保持一致

### 2. 已提交到 Git

```bash
commit e1b93cb
Author: ...
Date: ...

    fix: 将后端默认端口从 5000 改为 3001（生产环境标准）
    
    原因：服务器上 .env 可能未被正确加载，导致后端监听 5000（默认值）
    而不是 3001（.env 配置值）。改变默认值确保即使 .env 加载失败，
    后端也能监听正确的 3001 端口，与 Nginx 代理和 Vite 配置一致。
```

---

## 在服务器上的立即操作

### 步骤 1：更新代码

```bash
cd /www/wwwroot/your-project
git pull origin main
# 应该看到：
# Updating 14b3c62..e1b93cb
# Fast-forward
#  backend/src/server.js | 2 +-
```

### 步骤 2：杀死旧的进程

```bash
# 杀死监听 5000 的 node 进程
kill -9 1050630

# 或者通过宝塔面板：
# 宝塔 → Node.js 项目管理 → 选择项目 → 点击"停止"icon
```

**验证：**
```bash
lsof -i :5000
# 应该没有输出（没有进程）
```

### 步骤 3：重启后端

**方式 A：手动启动（快速测试）**
```bash
cd /www/wwwroot/your-project/backend
npm start
# 应该看到：
# 🎉 个人网站 API 服务正在运行
# 🔍 [收到请求] ...
# 监听地址: http://0.0.0.0:3001
```

**方式 B：通过宝塔面板启动（推荐生产环境）**
```
1. 打开宝塔面板
2. 点击"软件商店" → "Node.js"
3. 找到你的项目名称
4. 点击"启动"或"重启"按钮
5. 等待状态变为"运行中"
```

### 步骤 4：验证端口

```bash
# 检查 3001 是否在监听
lsof -i :3001
# 应该看到：
# COMMAND     PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# node    xxxxx root   23u  IPv4 xxxxxx      0t0  TCP *:3001 (LISTEN)
```

### 步骤 5：测试 API

```bash
# 测试后端是否正常工作
curl http://localhost:3001/api/blog
# 应该返回 JSON（博客列表）

# 测试评论接口
curl http://localhost:3001/api/comments
# 应该返回 JSON（评论列表）

# 从前端测试（打开浏览器）
https://your-domain.com/api/blog
# 应该看到返回的 JSON 数据
```

---

## 问题排查流程

### 如果重启后仍然监听 5000

**检查点：**

1. **验证代码是否更新**
   ```bash
   cat backend/src/server.js | grep "PORT ||"
   # 应该看到：const PORT = process.env.PORT || 3001;
   ```

2. **检查是否真的杀死了旧进程**
   ```bash
   ps aux | grep node
   # 应该看不到任何 node 进程
   ```

3. **检查 .env 路径是否正确**
   ```bash
   pwd
   # 应该在 /www/wwwroot/your-project/backend
   cat .env | grep PORT
   # 应该能看到 PORT=3001
   ```

4. **检查 npm start 启动的是哪个文件**
   ```bash
   cat backend/package.json | grep "start"
   # 应该看到 "start": "node src/server.js"
   ```

### 如果 API 返回 502 或无法连接

**症状：** 3001 有进程，但 API 返回 502

**排查：**
```bash
# 1. 查看后端日志
tail -f /path/to/backend/logs/*.log

# 2. 检查数据库连接
# 查看是否有"数据库连接失败"的错误

# 3. 测试数据库连接（PostgreSQL）
psql -h localhost -U postgres -d my_website -c "SELECT 1;"
```

---

## 修复验证清单

```
□ git pull origin main 成功
□ 后端进程已停止（不再监听 5000）
□ 后端已重启
□ lsof -i :3001 能看到 node 进程
□ curl http://localhost:3001/api/blog 返回 JSON
□ 前端能访问 https://your-domain.com/
□ Nginx 日志中没有 502 Bad Gateway 错误
□ 评论系统能正常加载
□ 文件上传功能正常
```

---

## 关键更新总结

| 变更 | 前 | 后 |
|------|------|------|
| **server.js 默认端口** | 5000 | 3001 |
| **实际监听端口** | 5000 ❌ | 3001 ✅ |
| **与 Nginx 配置一致** | ❌ | ✅ |
| **与 Vite 代理一致** | ❌ | ✅ |
| **与 .env 配置一致** | ❌ | ✅ |

---

## 预防措施

为了防止以后再出现类似问题，建议：

1. **不要依赖 .env 的加载** - 使用默认值作为 fallback（已修复 ✅）
2. **启动时输出实际监听的端口** - 便于调试（已在 server.js 中）
3. **添加端口健康检查** - 监控端口是否正确
4. **使用 PM2 或 systemd** - 更可靠的进程管理

---

**下一步：** 在服务器上执行上面的步骤 1-5，有任何问题立即反馈！
