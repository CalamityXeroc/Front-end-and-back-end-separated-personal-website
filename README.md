# 个人网站项目 (Personal Website)

> 一个基于 Vue 3 + Node.js 的全栈个人网站，采用前后端分离架构。包含博客系统、照片墙、以及基于 Mapbox GL JS 的 WebGIS 可视化功能。
> 
## 核心功能

### 沉浸式沙盒套件 (Sandbox)
基于 **CesiumJS 1.144+** 打造的三维体验套件，从 `/maps` 页面左上角浮动切换模块进入：

- **三维沙盘 (`/cesium`)**
  - 多源图层：OSM 全球三维建筑、Cesium 世界地形、Google 卫星影像、Google 写实 3D 场景、中国省界 GeoJSON（可开关）
  - 光影与后处理链：太阳光照、ShadowMap 阴影、HDR 曝光、可切换色调映射（Tonemapper）、泛光 Bloom、FXAA
  - 视角系统：全球城市预设飞行（北京/上海/珠峰/纽约/东京/迪拜/太空），目标点锁定屏幕中心；远距离自动俯视扶正，任意缩放尺度地球始终居中
  - 工程化 HUD：FPS/帧时/瓦片队列/实体计数、经纬度与高程实时读数、仿真时钟播放控制
- **引擎沙盒 (`/sandbox`)**
  - Minecraft 风格体素玩法：网格吸附放置/破坏方块、7 格物品栏（数字键/滚轮切换）、6 种程序化生成纹理方块
  - 3D 体素人形角色，`C` 键切换第一/第三人称，Pointer Lock 准星瞄准
  - 自动昼夜循环、可投掷光球（重力+反弹物理）、建筑碰撞
  - 场景控制台：时刻/雾效/阴影/霓虹/Bloom/曝光/色调映射实时调节，`H` 键沉浸模式

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
- **前端**：Vue 3, CesiumJS, Mapbox GL JS, MapboxDraw, Axios, Markdown-it
- **后端**：Node.js, Express, PostgreSQL
- **地图服务**：Mapbox GL JS

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
VITE_MAPBOX_STYLE=your_mapbox_style_url
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token
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
# 服务运行在 http://localhost:3000（首次启动自动拷贝 Cesium 静态资源到 public/cesium）
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
- **Cesium 静态资源**：`CESIUM_BASE_URL` 按环境自动切换——本地开发使用 `public/cesium`（前置脚本自动拷贝），生产环境复用 `/mapbox/cesium`（与 MapBox 子应用共享，无需重复上传）

## 📄 License
MIT
