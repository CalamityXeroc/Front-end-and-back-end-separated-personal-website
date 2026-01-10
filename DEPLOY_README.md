# 🚀 一键部署指南

本项目提供了两个一键部署脚本，可以快速将网站部署到宝塔面板服务器。

---

## 📋 部署前准备

### 1. 服务器环境准备

在宝塔面板上完成以下操作：

- **安装 PostgreSQL 数据库**
  - 宝塔 → 软件商店 → 搜索"PostgreSQL" → 安装
  - 创建数据库：`my_website`，用户：`postgres`，设置密码

- **安装 Node.js 版本管理器**
  - 宝塔 → 软件商店 → 搜索"Node.js 版本管理器" → 安装
  - 安装 Node.js 24.x 版本

- **安装 Nginx**（通常已默认安装）

- **开放端口**
  - 宝塔 → 安全 → 添加规则：端口 `5000`，协议 `TCP`

### 2. 本地环境准备

- 安装 Node.js（已安装 ✅）
- 安装 SSH 客户端（Windows 需要 OpenSSH 或 Git Bash）
- 确保能通过 SSH 连接到服务器

**Windows 用户安装 OpenSSH**：
```powershell
# 以管理员身份运行 PowerShell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 3. 配置 SSH 密钥登录（推荐，避免每次输入密码）

```powershell
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@你的服务器IP "cat >> ~/.ssh/authorized_keys"
```

---

## 🎯 使用方法

### Windows 用户（推荐使用 PowerShell 脚本）

**第一步：编辑配置**

打开 `deploy.ps1` 文件，修改以下配置：

```powershell
# 修改这些变量
$SERVER_IP = "123.45.67.89"              # 改成你的服务器 IP
$REMOTE_FRONTEND_PATH = "/www/wwwroot/你的域名"  # 改成实际的网站根目录
$DB_PASSWORD = "你的数据库密码"           # 改成实际密码
```

**第二步：执行部署**

在项目根目录打开 PowerShell：

```powershell
# 允许执行脚本（首次需要）
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 执行部署
.\deploy.ps1
```

---

### Linux/Mac 用户（使用 Bash 脚本）

**第一步：编辑配置**

打开 `deploy.sh` 文件，修改配置：

```bash
SERVER_IP="123.45.67.89"              # 改成你的服务器 IP
REMOTE_FRONTEND_PATH="/www/wwwroot/你的域名"  # 改成实际的网站根目录
DB_PASSWORD="你的数据库密码"           # 改成实际密码
```

**第二步：赋予执行权限并部署**

```bash
# 添加执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

---

## 🔄 部署流程说明

脚本会自动完成以下操作：

1. ✅ **检查本地环境**（npm、ssh、scp）
2. ✅ **构建前端项目**（`npm run build`）
3. ✅ **打包后端项目**（排除 node_modules）
4. ✅ **上传前端到服务器**（清空旧文件 → 上传新文件）
5. ✅ **上传后端到服务器**（自动创建 .env 文件）
6. ✅ **安装后端依赖**（`npm install --production`）
7. ✅ **初始化数据库**（创建表结构）
8. ✅ **重启后端服务**（使用 PM2）
9. ✅ **清理临时文件**

---

## 🛠️ 部署后配置

### 1. 配置 Nginx 反向代理

登录宝塔面板，编辑网站配置文件：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    root /www/wwwroot/你的域名;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
    }
}
```

保存并重启 Nginx。

### 2. 修改前端 API 地址（如果使用了反向代理）

编辑本地 `src/api/index.js`：

```javascript
baseURL: '/api',  // 改成相对路径
```

重新执行部署脚本。

### 3. 配置 HTTPS（可选但推荐）

- 宝塔 → 网站 → SSL → Let's Encrypt
- 输入邮箱，点击"申请"
- 开启"强制 HTTPS"

---

## 📊 常用命令

### 查看后端服务状态

```bash
ssh root@你的服务器IP "pm2 status"
```

### 查看后端日志

```bash
ssh root@你的服务器IP "pm2 logs my-backend"
```

### 重启后端服务

```bash
ssh root@你的服务器IP "pm2 restart my-backend"
```

### 停止后端服务

```bash
ssh root@你的服务器IP "pm2 stop my-backend"
```

---

## ❗ 常见问题

### 1. SSH 连接失败

**问题**：Permission denied 或 Connection refused

**解决**：
- 检查服务器 IP 和端口是否正确
- 确认服务器防火墙开放了 SSH 端口（22）
- 尝试手动连接测试：`ssh root@你的服务器IP`

### 2. npm 命令未找到

**问题**：Command 'npm' not found

**解决**：
- 确认宝塔已安装 Node.js 版本管理器
- 脚本会自动创建软链接，如果失败请手动执行：
  ```bash
  ln -sf /www/server/nodejs/v24.x.x/bin/node /usr/bin/node
  ln -sf /www/server/nodejs/v24.x.x/bin/npm /usr/bin/npm
  ```

### 3. 数据库连接失败

**问题**：Database connection failed

**解决**：
- 检查 PostgreSQL 是否已启动
- 确认数据库名、用户名、密码是否正确
- 手动测试连接：
  ```bash
  ssh root@你的服务器IP "psql -U postgres -d my_website -c '\dt'"
  ```

### 4. 前端页面空白

**问题**：页面加载后显示空白

**解决**：
- 按 F12 查看浏览器控制台错误
- 检查 Nginx 配置中的 `root` 路径是否正确
- 确认前端 API 地址配置正确

### 5. 后端 API 404

**问题**：前端请求后端返回 404

**解决**：
- 检查后端服务是否启动：`pm2 status`
- 检查端口 5000 是否开放
- 测试后端接口：`curl http://你的服务器IP:5000/api/blog`

---

## 🔐 安全建议

1. **修改默认密码**：数据库、服务器、宝塔面板都要使用强密码
2. **配置 HTTPS**：保护数据传输安全
3. **定期备份**：数据库和代码定期备份
4. **更新依赖**：定期更新 npm 包修复安全漏洞
5. **限制 SSH 访问**：禁用密码登录，只允许密钥登录

---

## 📝 更新部署

每次修改代码后，只需重新运行部署脚本即可：

```powershell
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

脚本会自动覆盖旧文件并重启服务。

---

## 💡 提示

- 首次部署时间较长（约 3-5 分钟），后续更新会更快
- 建议在非高峰期部署，避免影响用户访问
- 部署前可以先在本地测试功能是否正常
- 保持服务器磁盘空间充足（至少 5GB 可用空间）

---

## 📞 获取帮助

如果遇到问题，可以：

1. 查看脚本输出的错误信息
2. 检查服务器日志：`pm2 logs my-backend`
3. 查看 Nginx 错误日志：`/www/wwwlogs/你的域名.error.log`
4. 在宝塔面板查看 Node.js 项目状态

---

**祝部署顺利！** 🎉
