# 个人网站项目 (Personal Website)

> 一个基于 Vue 3 + Node.js 的全栈个人网站，采用前后端分离架构。包含博客系统、照片墙、以及基于 Mapbox GL JS 的 WebGIS 可视化功能。
> 
##  核心功能

###  GIS 可视化 (Maps)
- **多底图切换**：支持矢量底图（vec_w）与卫星底图（img_w）切换。
- **空间数据加载**：前端解析 GeoJSON（省界）与 CSV（统计数据）并进行属性挂接。
- **交互式地图**：支持鼠标悬停高亮、Popup 信息窗展示、点击飞入定位。
- **代理服务**：后端实现了 Node.js 代理，自动处理 User-Agent 伪造与图片格式修正。

###  博客系统
- 支持 Markdown 编辑与实时预览。
- 表格插入与 Excel 导入功能。


### 🎮 引擎沙盒 (Engine Sandbox)
- **第三人称自由移动**: WASD 移动、鼠标视角、空格跳跃、Shift 疾跑
- **3D 虚拟世界**: 程序化生成的低多边形城市(建筑+树木+地面网格)
- **交互系统**: 左键放置霓虹方块(可堆叠)、右键投掷光球(物理反弹)
- **后处理特效**: Bloom 泛光、HDR 曝光、Tonemapper 色调映射、雾效、阴影
- **昼夜切换**: 霓虹夜间模式 + 24 小时时刻滑杆
- **第一/第三人称切换**: 按 C 键切换视角
- **UI 隐藏**: 按 H 键隐藏/显示所有界面元素

### 🌐 三维沙盘 (Cesium 3D)
- 基于 CesiumJS 1.144 的地球三维可视化
- 全球 OSM 建筑 + 世界地形 + Google 卫星影像
- 后处理链(Bloom/AO/FXAA)、动态光照、粒子系统
- 无人机轨迹仿真 + 中国省界 GeoJSON

> 技术栈: CesiumJS 1.144 + Vue 3 + Vite

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
