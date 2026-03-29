# ⚡ 端口问题 - 快速修复（仅需 3 步）

**🔴 问题：** 后端监听 5000，但应该是 3001  
**✅ 解决：** 已改好了，用户只需执行 3 步

---

## 立即在服务器上执行

### 1️⃣ 更新代码（1分钟）

```bash
cd /www/wwwroot/your-project
git pull origin main
```

**验证：** 应该看到
```
Updating e1b93cb..ccaf504
Fast-forward
 backend/src/server.js | 2 +-
 ...
```

---

### 2️⃣ 杀死旧进程（1分钟）

```bash
# 杀死监听 5000 的旧 node 进程
kill -9 1050630

# 或通过宝塔面板：
# 宝塔 → 软件商店 → Node.js 
# → 找到你的项目 → 点"停止"
```

**验证：**
```bash
lsof -i :5000
# 应该没有输出
```

---

### 3️⃣ 重启后端（1分钟）

**方式 A：宝塔面板（推荐）**
```
打开宝塔面板
→ 软件商店 → Node.js
→ 找到项目 → 点"启动"
```

**方式 B：手动启动**
```bash
cd /www/wwwroot/your-project/backend
npm start
```

**验证：** 应该看到
```
🎉 个人网站 API 服务正在运行
监听地址: http://0.0.0.0:3001
```

---

## 完成验证

```bash
# 测试 3001 是否在监听
lsof -i :3001
# 应该看到 node 进程

# 测试 API 是否工作
curl http://localhost:3001/api/blog
# 应该返回 JSON

# 打开浏览器测试
https://your-domain.com/
# 应该能加载首页
```

---

## 修改了什么

**文件：** `backend/src/server.js` 第 13 行

```diff
- const PORT = process.env.PORT || 5000;  ❌ 旧
+ const PORT = process.env.PORT || 3001;  ✅ 新
```

**原因：** 服务器上 `.env` 没有被加载，所以改变默认值确保后端监听正确的 3001 端口

---

## 如果有问题

**问题 1：重启后还是 5000**
```bash
# 检查代码是否更新
cat backend/src/server.js | grep "PORT ||"
# 应该看到 3001
```

**问题 2：API 返回 502**
```bash
# 检查数据库连接
psql -h localhost -U postgres -d my_website -c "SELECT 1;"

# 查看后端日志
tail -f /www/wwwroot/your-project/backend/logs/*.log
```

**问题 3：不确定做没做对**
```bash
# 运行诊断脚本（需要 bash）
bash verify-port-fix.sh
```

---

**完成！** 3 步搞定，开始享受正常的网站吧 🎉

详见：`PORT_FIX_GUIDE.md`（完整指南）
