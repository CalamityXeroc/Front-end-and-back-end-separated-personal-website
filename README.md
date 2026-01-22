# 个人网站项目 (Personal Website) 

> 一个基于 Vue 3 + Node.js 的全栈个人网站，采用前后端分离架构。包含博客系统、照片墙、以及基于 Mapbox GL JS 的 WebGIS 可视化功能。

**Latest Update: 2026年1月22日**
-  **地图模块升级**：集成 Mapbox GL JS + 天地图底图（矢量/卫星/注记）。
-  **数据可视化**：新增 2022 年中国各省森林覆盖率分级设色图（2D平面可视化）。
-  **后端代理**：新增 `/api/tdt` 代理接口，解决天地图 WMTS 服务跨域与 Token 问题。
-  **关于页面**：新增地图故事项目展示卡片及外部跳转交互。

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
- **前端**：Vue 3, Mapbox GL JS, Axios, Markdown-it
- **后端**：Node.js, Express, PostgreSQL
- **地图服务**：天地图 API (WMTS)

##  快速开始

### 1. 环境准备
确保本地安装了 Node.js (v16+) 和 PostgreSQL。

### 2. 启动后端 (必须)
地图底图依赖后端代理，必须启动后端服务。
```bash
cd backend
npm install
# 配置 .env 文件 (参考 .env.example)
npm start
# 服务运行在 http://localhost:3001
```

### 3. 启动前端
```bash
npm install
npm run dev
# 服务运行在 http://localhost:3000
```

##  部署注意事项
- **后端上传**：必须将 `backend/src` 和 `package.json` 上传至服务器，以启用地图代理服务。
- **数据隐私**：`.env` 文件包含敏感密钥，**请勿**提交到版本控制系统。
- **GeoData**：地图数据文件（GeoJSON/CSV）位于前端 `public/geoData` 目录。

##  License
MIT
