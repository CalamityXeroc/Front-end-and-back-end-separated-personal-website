# 个人网站项目 (Personal Website)

> 一个基于 Vue 3 + Node.js 的全栈个人网站，采用前后端分离架构。包含博客系统、照片墙、以及基于 Mapbox GL JS 的 WebGIS 可视化功能。

## 📋 更新日志

### v1.2.0 (2026年1月29日)
- ✨ **地图绘制工具升级**：
  - 新增点/线/面样式自定义（颜色、大小、透明度）
  - 修复点工具只能画一个点的问题，支持连续绘制
  - 绘图模式下禁止地图交互干扰
  - 新样式只影响新绘制的图形，已有图形保持不变
- 📱 **移动端适配**：工具箱默认折叠，悬浮按钮展开
- 🔗 **外部数据下载**：新增阿里云 DataV、POI86 等数据源链接
- 🔒 **安全性提升**：API Key 和密码移至环境变量，不再硬编码

### v1.1.0 (2026年1月22日)
- 🗺️ **地图模块升级**：集成 Mapbox GL JS + 天地图底图（矢量/卫星/注记）
- 📊 **数据可视化**：新增 2022 年中国各省森林覆盖率分级设色图
- 🔧 **后端代理**：新增 `/api/tdt` 代理接口，解决天地图跨域问题
- 📄 **关于页面**：新增地图故事项目展示卡片

##  核心功能

###  GIS 可视化 (Maps)
- **多底图切换**：支持天地图矢量底图（vec_w）与卫星底图（img_w）切换。
- **空间数据加载**：前端解析 GeoJSON（省界）与 CSV（统计数据）并进行属性挂接。
- **交互式地图**：支持鼠标悬停高亮、Popup 信息窗展示、点击飞入定位。
- **代理服务**：后端实现了 Node.js 代理，自动处理 User-Agent 伪造与图片格式修正。

###  博客系统
- 支持 Markdown 编辑与实时预览。
- 表格插入与 Excel 导入功能。

###  其他功能
- 照片墙展示
- 个人简历 (About) 页面

##  技术栈
- **前端**：Vue 3, Mapbox GL JS, MapboxDraw, Axios, Markdown-it
- **后端**：Node.js, Express, PostgreSQL
- **地图服务**：天地图 API (WMTS), Mapbox GL JS

## 🚀 快速开始

### 1. 环境准备
确保本地安装了 Node.js (v16+) 和 PostgreSQL。

### 2. 配置环境变量

**前端配置** - 复制 `.env.example` 为 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入你的密钥：
```env
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_ADMIN_PASSWORD=your_password
```

**后端配置** - 复制 `backend/.env.example` 为 `backend/.env`：
```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 填入数据库和天地图密钥：
```env
DB_PASSWORD=your_db_password
TDT_KEY=your_tianditu_key
```

### 3. 启动后端 (必须)
地图底图依赖后端代理，必须启动后端服务。
```bash
cd backend
npm install
npm start
# 服务运行在 http://localhost:3001
```

### 4. 启动前端
```bash
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

### 5. 构建生产版本
```bash
npm run build
# 生成 dist/ 文件夹
```

## 🔒 安全说明
- **请勿**将 `.env`、`.env.local`、`backend/.env` 提交到版本控制
- 所有 API Key 和密码都应通过环境变量配置
- `.gitignore` 已配置忽略敏感文件

## 📦 部署注意事项
- **后端上传**：必须将 `backend/` 目录（不含 `.env`）上传至服务器
- **GeoData**：地图数据文件位于 `public/geoData` 目录
- **环境变量**：服务器需单独配置 `.env` 文件

## 📄 License
MIT
