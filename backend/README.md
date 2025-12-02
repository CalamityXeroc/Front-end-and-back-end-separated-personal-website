# 个人网站后端 API

这是一个使用 Express + PostgreSQL + Sequelize 构建的后端 API 服务。

## 📁 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.js  # 数据库连接
│   │   ├── upload.js    # 文件上传配置
│   │   └── initDatabase.js  # 数据库初始化脚本
│   ├── models/          # 数据模型
│   │   ├── Blog.js      # 博客模型
│   │   ├── Photo.js     # 照片模型
│   │   └── MapMarker.js # 地图标记模型
│   ├── controllers/     # 控制器
│   │   ├── blogController.js
│   │   └── photoController.js
│   ├── routes/          # 路由
│   │   ├── blogRoutes.js
│   │   ├── photoRoutes.js
│   │   └── uploadRoutes.js
│   └── server.js        # 主服务器文件
├── uploads/             # 上传文件存储目录
├── .env                 # 环境变量配置
├── .gitignore
└── package.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件，设置你的 PostgreSQL 数据库信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my_website
DB_USER=postgres
DB_PASSWORD=你的数据库密码
```

### 3. 初始化数据库

确保 PostgreSQL 已经安装并运行，然后创建数据库：

```sql
CREATE DATABASE my_website;
```

运行初始化脚本：

```bash
npm run init-db
```

### 4. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 📡 API 接口文档

### 博客接口

- `GET /api/blog` - 获取所有博客
- `GET /api/blog/:id` - 获取单篇博客
- `POST /api/blog` - 创建博客
- `PUT /api/blog/:id` - 更新博客
- `DELETE /api/blog/:id` - 删除博客

### 照片接口

- `GET /api/photo` - 获取所有照片
- `GET /api/photo/:id` - 获取单张照片
- `POST /api/photo` - 添加照片记录
- `DELETE /api/photo/:id` - 删除照片

### 文件上传接口

- `POST /api/upload/single` - 单文件上传
- `POST /api/upload/multiple` - 多文件上传

## 📝 使用示例

### 创建博客

```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的新博客",
    "content": "这是博客内容",
    "tags": ["技术", "生活"]
  }'
```

### 上传图片

```bash
curl -X POST http://localhost:3000/api/upload/single \
  -F "file=@/path/to/image.jpg"
```

## 🛠️ 技术栈

- **Express.js** - Web 框架
- **Sequelize** - ORM
- **PostgreSQL** - 数据库
- **Multer** - 文件上传
- **Morgan** - 日志记录
- **CORS** - 跨域支持

## 📦 数据库模型

### Blog（博客）
- id, title, content, author, coverImage, tags, views, createdAt, updatedAt

### Photo（照片）
- id, title, description, imageUrl, takenAt, location, tags, createdAt, updatedAt

### MapMarker（地图标记）
- id, name, description, longitude, latitude, visitDate, category, createdAt, updatedAt
