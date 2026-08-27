<template>
  <div class="sandbox-view">
    <!-- 三维场景容器 -->
    <div ref="globe" class="globe"></div>

    <!-- HUD:左上 引擎状态 -->
    <div class="hud hud-top">
      <div class="hud-title">
        <span class="dot"></span>CESIUM ENGINE · 三维沙盘
      </div>
      <div class="hud-line mono">
        <span>FPS <b>{{ fpsText }}</b></span>
        <span>帧时 <b>{{ frameMsText }}ms</b></span>
        <span>瓦片 <b>{{ tileQueue }}</b></span>
        <span>实体 <b>{{ entityCount }}</b></span>
      </div>
      <div class="hud-line mono dim">
        <span>经 {{ lonText }}°</span>
        <span>纬 {{ latText }}°</span>
        <span>高 {{ altText }}m</span>
      </div>
      <div class="hud-line mono dim">
        <span>☀️ {{ clockText }}</span>
      </div>
    </div>

    <!-- 右上:快捷操作 -->
    <div class="hud-actions">
      <button class="btn-hud" @click="flyHome" title="回到北京默认视角">⏺ 复位</button>
      <button class="btn-hud" @click="toggleFullscreen">⛶ 全屏</button>
      <button class="btn-hud accent" @click="snapshot">📸 截图</button>
    </div>

    <!-- 左侧:引擎控制台 -->
    <aside class="console" :class="{ collapsed }">
      <header class="console-header" @click="collapsed = !collapsed">
        <span class="console-icon">⚙️</span>
        <span class="console-title">引擎控制台</span>
        <span class="console-toggle">{{ collapsed ? '▶' : '◀' }}</span>
      </header>

      <div class="console-body" v-show="!collapsed">
        <!-- 场景飞行 -->
        <section class="panel">
          <h4 class="panel-title">🎯 视角</h4>
          <div class="btn-grid">
            <button v-for="p in presets" :key="p.name" class="btn-chip" @click="flyTo(p)">
              {{ p.name }}
            </button>
          </div>
        </section>

        <!-- 光影 -->
        <section class="panel">
          <h4 class="panel-title">🌗 光影</h4>
          <div class="ctrl">
            <span class="label">太阳光照 <span class="hint">(日/夜着色)</span></span>
            <label class="switch">
              <input type="checkbox" :checked="lighting" @click="setLighting(!lighting)" />
              <span class="track"></span>
            </label>
          </div>
          <div class="ctrl">
            <span class="label">时刻 <b class="mono">{{ hourText }}</b></span>
            <input type="range" min="0" max="23.5" step="0.5" v-model.number="hour" @input="applyTimeOfDay" />
          </div>
          <div class="ctrl">
            <span class="label">阴影 ShadowMap</span>
            <label class="switch">
              <input type="checkbox" :checked="shadowOn" @change="setShadows(!shadowOn)" />
              <span class="track"></span>
            </label>
          </div>
        </section>

        <!-- 后处理 -->
        <section class="panel">
          <h4 class="panel-title">🎨 后处理链</h4>
          <div class="ctrl">
            <span class="label">HDR 曝光 <em class="mono">{{ exposure.toFixed(1) }}</em></span>
            <input type="range" min="0.2" max="3" step="0.1" v-model.number="exposure" @input="setExposure" />
          </div>
          <div class="ctrl">
            <span class="label">色调映射 Tonemapper</span>
            <select v-model="tonemapperKey" @change="setTonemapper" class="sel">
              <option value="ACES">ACES(电影感)</option>
              <option value="PBR_NEUTRAL">PBR Neutral(默认)</option>
              <option value="FILMIC">Filmic</option>
              <option value="REINHARD">Reinhard</option>
            </select>
          </div>
          <div class="ctrl">
            <span class="label">泛光 Bloom</span>
            <div class="ctrl-right">
              <input
                type="range"
                min="0.5" max="4" step="0.1"
                v-model.number="bloomIntensity"
                :disabled="!bloomOn"
                @input="setBloomIntensity"
              />
              <label class="switch">
                <input type="checkbox" :checked="bloomOn" @change="setBloomOn(!bloomOn)" />
                <span class="track"></span>
              </label>
            </div>
          </div>
          <div class="ctrl">
            <span class="label">环境光遮蔽 AO</span>
            <label class="switch">
              <input type="checkbox" :checked="aoOn" @change="setAOO(!aoOn)" />
              <span class="track"></span>
            </label>
          </div>
          <div class="ctrl">
            <span class="label">FXAA 抗锯齿</span>
            <label class="switch">
              <input type="checkbox" :checked="fxaaOn" @change="setFxaaOn(!fxaaOn)" />
              <span class="track"></span>
            </label>
          </div>
        </section>

        <!-- 环境 -->
        <section class="panel">
          <h4 class="panel-title">🌫️ 环境</h4>
          <div class="ctrl">
            <span class="label">大气与天空盒</span>
            <label class="switch">
              <input type="checkbox" :checked="atmoOn" @change="setAtmoOn(!atmoOn)" />
              <span class="track"></span>
            </label>
          </div>
          <div class="ctrl">
            <span class="label">雾密度 <em class="mono">{{ fogDensity.toFixed(4) }}</em></span>
            <input type="range" min="0" max="0.0024" step="0.00005" v-model.number="fogDensity" @input="setFog" />
          </div>
          <div class="ctrl">
            <span class="label">垂直夸张 <em class="mono">x{{ exaggeration.toFixed(1) }}</em></span>
            <input type="range" min="1" max="30" step="0.5" v-model.number="exaggeration" @input="setExaggeration" />
          </div>
        </section>

        <!-- 图层 -->
        <section class="panel">
          <h4 class="panel-title">🗂️ 图层 / 内容</h4>
          <div class="ctrl" v-for="row in layerRows" :key="row.key">
            <span class="label">{{ row.label }}</span>
            <label class="switch">
              <input type="checkbox" :checked="row.get()" @change="row.set(!row.get())" />
              <span class="track"></span>
            </label>
          </div>
          <div class="hint-warn" v-if="photorealErr">⚠ Google 写实场景加载失败,稍后重试</div>
        </section>

        <!-- 粒子沙盒 -->
        <section class="panel">
          <h4 class="panel-title">🧨 粒子沙盒 <span class="hint">点击 3D 场景引爆</span></h4>
          <div class="btn-grid">
            <button
              v-for="m in particleModes"
              :key="m.key"
              class="btn-chip"
              :class="{ armed: particleMode === m.key }"
              @click="setParticleMode(m.key === particleMode ? 'off' : m.key)"
            >
              {{ m.icon }} {{ m.label }}
            </button>
          </div>
          <div class="idle-note" v-if="particleMode !== 'off'">
            🖱 已武装 —— 在地球上任一位置单击发射
          </div>
        </section>

        <footer class="console-foot">CesiumJS {{ cesiumVersion }} · Apache-2.0 · 本地演示</footer>
      </div>
    </aside>

    <!-- 右下角:仿真时钟控制 -->
    <div class="hud-bottom">
      <button class="btn-ghost" @click="togglePlay" :title="playing ? '暂停时钟' : '播放时钟(昼夜联动)'">
        {{ playing ? '⏸' : '▶' }}
      </button>
      <span class="mono hud-clock">{{ clockText }}</span>
      <button class="btn-ghost" @click="resetClock" title="回到 00:00">⏮</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
// 预打包 ESM 入口:引入官方已捆绑单文件,避免 CJS 依赖(urijs/mersenne-twister)的 default 导出互指问题
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

/* ===================== 常量 ===================== */
const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
const ION = {
  OSM_BUILDINGS: 96188,
  IMAGERY_BING_PLAIN: 2,
  IMAGERY_BING: 3,
  TERRAIN: 1,
  GOOGLE_SAT: 3830186,          // Google 2D 卫星(带标注)
  GOOGLE_PHOTOREAL: 2275207,    // Google 写实 3D Tiles
};
const ASSET_BASE = `${(window.CESIUM_BASE_URL || '/cesium').replace(/\/$/, '')}/Assets/Textures`;

const presets = [
  { name: '北京', lon: 116.3913, lat: 39.9075, h: 3800 },
  { name: '上海', lon: 121.4737, lat: 31.2304, h: 4600 },
  { name: '深圳', lon: 114.0579, lat: 22.5431, h: 3800 },
  { name: '珠峰', lon: 86.9250, lat: 27.9881, h: 42000 },
  { name: '纽约', lon: -74.0060, lat: 40.7128, h: 5200 },
  { name: '东京', lon: 139.6917, lat: 35.6895, h: 4800 },
  { name: '迪拜', lon: 55.2708, lat: 25.2048, h: 4600 },
  { name: '太空', lon: 120, lat: 30, h: 30000000 },
];

/* ===================== Vue 状态 ===================== */
const globe = ref(null);
const collapsed = ref(false);

const fpsText = ref('--');
const frameMsText = ref('--');
const tileQueue = ref(0);
const entityCount = ref(0);
const lonText = ref('--');
const latText = ref('--');
const altText = ref('--');
const clockText = ref('--');

const hour = ref(6);
const lighting = ref(false);
const shadowOn = ref(false);
const exposure = ref(1.0);
const tonemapperKey = ref('PBR_NEUTRAL');
const bloomOn = ref(true);
const bloomIntensity = ref(2.0);
const aoOn = ref(false);
const fxaaOn = ref(true);
const atmoOn = ref(true);
const fogDensity = ref(0);
const exaggeration = ref(1);
const osmOn = ref(true);
const terrainOn = ref(true);
const googleImageryOn = ref(false);
const photorealOn = ref(false);
const photorealErr = ref(false);
const cityOn = ref(false);
const droneOn = ref(true);
const geojsonOn = ref(false);

const particleModes = [
  { key: 'smoke', icon: '💨', label: '浓烟' },
  { key: 'fire', icon: '🔥', label: '火焰' },
  { key: 'explosion', icon: '💥', label: '爆炸' },
  { key: 'fireworks', icon: '🎆', label: '烟花' },
];
const particleMode = ref('off');

const playing = ref(false);
const cesiumVersion = ref('');

const hourText = computed(() => {
  const h = Math.floor(hour.value);
  const m = Math.round((hour.value - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

/* ===================== Cesium 实例(非响应式) ===================== */
let viewer = null;
let osmTiles = null;
let photoRealTiles = null;
let buildingEntities = [];
let geoDs = null;
let droneEntity = null;
let droneFrame = 0;          // 无人机独立时钟(s)
let rafId = 0;
let lastFrame = 0;
let fpsAcc = 0;
let fpsFrames = 0;

/* ===================== 粒子纹理 ===================== */
function makeParticleTexture(stops, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL();
}
const TEX = {
  smoke: makeParticleTexture([
    [0, 'rgba(240,240,245,0.9)'],
    [0.4, 'rgba(170,170,175,0.5)'],
    [1, 'rgba(40,40,45,0)'],
  ]),
  fire: makeParticleTexture([
    [0, 'rgba(255,255,200,1)'],
    [0.35, 'rgba(255,150,40,0.95)'],
    [0.7, 'rgba(200,40,10,0.5)'],
    [1, 'rgba(120,10,0,0)'],
  ]),
  spark: makeParticleTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.5, 'rgba(255,225,120,0.85)'],
    [1, 'rgba(255,120,0,0)'],
  ]),
};

/* ===================== 初始化 ===================== */
onMounted(async () => {
  Cesium.Ion.defaultAccessToken = ION_TOKEN;
  if (!ION_TOKEN) console.warn('[sandbox] 未配置 VITE_CESIUM_ION_TOKEN,将使用免费数据源');

  viewer = new Cesium.Viewer(globe.value, {
    baseLayer: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
    scene3DOnly: true,
    contextOptions: {
      webgl: { alpha: true, antialias: true, preserveDrawingBuffer: true },
    },
  });

  const scene = viewer.scene;
  scene.globe.showGroundAtmosphere = true;
  scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1526');
  scene.highDynamicRange = true;
  scene.postProcessStages.fxaa.enabled = fxaaOn.value;
  scene.postProcessStages.bloom.enabled = bloomOn.value;
  scene.postProcessStages.bloom.uniforms.intensity = bloomIntensity.value;
  scene.skyAtmosphere.show = atmoOn.value;

  // 1) 基础影像(Bing 标签)
  await setBaseImagery('bing');

  // 2) 地形
  if (terrainOn.value) await trySetTerrain();

  // 3) OSM 建筑
  try {
    osmTiles = await Cesium.createOsmBuildingsAsync();
    scene.primitives.add(osmTiles);
  } catch (e) {
    console.warn('[sandbox] OSM 建筑加载失败', e);
  }

  // 4) 时钟:一整天长度,驱动太阳(23:59 全天)
  const day0 = new Date('2026-06-21T00:00:00Z');
  const start = Cesium.JulianDate.fromDate(day0);
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addSeconds(start, 86340, new Cesium.JulianDate());
  viewer.clock.currentTime = Cesium.JulianDate.addSeconds(start, hour.value * 3600, new Cesium.JulianDate());
  viewer.clock.multiplier = 180; // 播放时快速拉过一天
  viewer.clock.rangeType = Cesium.ClockRange.LOOP_STOP;

  // 5) 无人机(独立虚拟时钟,与观众无关)
  buildDrone();

  // 6) 程序化城市
  buildCity();

  // 7) 拾取粒子
  viewer.screenSpaceEventHandler.setInputAction(onSceneClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // HUD 循环
  lastFrame = performance.now();
  frameTick();

  // 调试句柄(F12 可在控制台直接操纵 viewer)
  window.__cesium = window.__viewer = viewer;

  cesiumVersion.value = Cesium.VERSION || '1.144';

  flyTo(presets[0]);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
    viewer = null;
  }
});

/* ===================== 数据源 ===================== */
async function setBaseImagery(kind) {
  if (!viewer) return;
  try {
    let provider;
    if (kind === 'google') {
      provider = await Cesium.IonImageryProvider.fromAssetId(ION.GOOGLE_SAT);
    } else if (kind === 'bing-plain') {
      provider = await Cesium.IonImageryProvider.fromAssetId(ION.IMAGERY_BING_PLAIN);
    } else {
      provider = await Cesium.IonImageryProvider.fromAssetId(ION.IMAGERY_BING);
    }
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(provider);
  } catch (e) {
    console.warn('[sandbox] 影像加载失败,回退 ArcGIS', e);
    try {
      const fb = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      );
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(fb);
    } catch (e2) {
      console.error('[sandbox] 影像均失败', e2);
    }
  }
}

async function trySetTerrain() {
  if (!viewer) return;
  try {
    const terrain = await Cesium.createWorldTerrainAsync();
    viewer.scene.setTerrain(new Cesium.Terrain(terrain));
    viewer.scene.globe.depthTestAgainstTerrain = true;
  } catch (e) {
    console.warn('[sandbox] 世界地形失败,保持椭球', e);
  }
}

async function loadPhotoreal(on) {
  if (!viewer || !on) { if (photoRealTiles) photoRealTiles.show = !!on; return; }
  if (!photoRealTiles) {
    try {
      photoRealTiles = await Cesium.Cesium3DTileset.fromIonAssetId(ION.GOOGLE_PHOTOREAL);
      photoRealTiles.style = new Cesium.Cesium3DTileStyle({ color: "color('#ffffff', 0.95)" });
      viewer.scene.primitives.add(photoRealTiles);
    } catch (e) {
      console.warn('[sandbox] 写实 3D 加载失败', e);
      photoRealTiles = null;
      photorealOn.value = false;
      return;
    }
  }
  photoRealTiles.show = true;
}

/* ===================== 场景对象 ===================== */
function buildDrone() {
  const center = { lon: 116.4074, lat: 39.9103 };
  const RAD = 0.006;   // 经/纬度半径
  const ALT = 1500;
  const PERIOD = 30;   // 一圈 30s

  // 轨迹(静态轨道线)
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    const lon = center.lon + Math.cos(a) * RAD * 1.25;
    const lat = center.lat + Math.sin(a) * RAD;
    pts.push(Cesium.Cartesian3.fromDegrees(lon, lat, ALT));
  }

  viewer.entities.add({
    polyline: {
      positions: pts,
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString('#59d3ff').withAlpha(0.55),
      }),
      arcType: Cesium.ArcType.RHUMB,
    },
  });

  // 航点标记
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        center.lon + Math.cos(a) * RAD * 1.25, center.lat + Math.sin(a) * RAD, ALT),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.25),
        outlineColor: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.9),
        outlineWidth: 1,
      },
    });
  }

  // 无人机本体(独立时间)
  droneEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => {
      const t = droneClock(); // 独立秒表
      const a = (t / DRONE_PERIOD) * Math.PI * 2;
      return Cesium.Cartesian3.fromDegrees(
        center.lon + Math.cos(a) * RAD * 1.25,
        center.lat + Math.sin(a) * RAD,
        ALT + Math.sin(a * 3) * 160
      );
    }, false),
    point: {
      pixelSize: 7,
      color: Cesium.Color.fromCssColorString('#ffe95c'),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 1,
      disableDepthTestDistance: 40000,
    },
    label: {
      text: '巡检无人机 UAV-07',
      font: '12px "PingFang SC", "Microsoft YaHei", sans-serif',
      fillColor: Cesium.Color.WHITE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      disableDepthTestDistance: 40000,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 80000),
    },
  });
}
const DRONE_PERIOD = 60;

function droneClock() {
  return playing.value ? (droneFrame += 1 / 60) : droneFrame;
}

function buildCity() {
  const C = { lon: 116.4405, lat: 39.930, };
  const cols = 22, rows = 22, spacing = 0.00085;
  let seed = 20260621;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const h = 16 + rnd() * 130;
      const w = 14 + rnd() * 16;
      const d = 14 + rnd() * 16;
      const lon = C.lon + (j - cols / 2) * spacing * 1.25;
      const lat = C.lat + (i - rows / 2) * spacing;
      const isWarm = rnd() > 0.72;
      const color = new Cesium.Color(
        isWarm ? 1.0 : 0.14,
        isWarm ? 0.55 : 0.75,
        1.0,
        1.0
      );
      const e = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, h / 2),
        box: {
          dimensions: new Cesium.Cartesian3(w, h, d),
          material: color,
        },
        show: false,
      });
      buildingEntities.push(e);
    }
  }
}

/* ===================== 控制处理 ===================== */
function setLighting(v) { lighting.value = !!v; if (viewer) viewer.scene.globe.enableLighting = !!v; }
function applyTimeOfDay() {
  if (!viewer) return;
  viewer.clock.currentTime = Cesium.JulianDate.addSeconds(
    Cesium.JulianDate.fromDate(new Date('2026-06-21T00:00:00Z')),
    hour.value * 3600,
    new Cesium.JulianDate()
  );
}
function setShadows(v) {
  shadowOn.value = v;
  if (viewer) {
    viewer.scene.shadowMap.enabled = v;
    viewer.scene.shadowMap.maximumDistance = 9000;
  }
}
function setExposure() {
  if (viewer) viewer.scene.postProcessStages.exposure = exposure.value;
}
function setTonemapper() {
  if (!viewer) return;
  viewer.scene.postProcessStages.tonemapper = Cesium.Tonemapper[tonemapperKey.value] ?? Cesium.Tonemapper.PBR_NEUTRAL;
}
function setBloomIntensity() {
  if (viewer) viewer.scene.postProcessStages.bloom.uniforms.intensity = bloomIntensity.value;
}
function setBloomOn(v) {
  bloomOn.value = v;
  if (viewer) {
    viewer.scene.postProcessStages.bloom.enabled = v;
    viewer.scene.postProcessStages.bloom.uniforms.intensity = bloomIntensity.value;
  }
}
function setAOO(v) { aoOn.value = v; if (viewer) viewer.scene.postProcessStages.ambientOcclusion.enabled = v; }
function setFxaaOn(v) { fxaaOn.value = v; if (viewer) viewer.scene.postProcessStages.fxaa.enabled = v; }
function setAtmoOn(v) {
  atmoOn.value = v;
  if (viewer) { viewer.scene.skyAtmosphere.show = v; viewer.scene.skyBox.show = v; }
}
function setFog() {
  if (viewer) {
    viewer.scene.fog.enabled = fogDensity.value > 0;
    viewer.scene.fog.density = Number(fogDensity.value);
  }
}
function setExaggeration() {
  if (viewer) viewer.scene.verticalExaggeration = Number(exaggeration.value);
}
function setOsm(v) { osmOn.value = v; if (osmTiles) osmTiles.show = v; }
async function setTerrainOnHandler(v) {
  terrainOn.value = v;
  if (v) await trySetTerrain();
}
function setGoogleImagery(v) {
  googleImageryOn.value = v;
  setBaseImagery(v ? 'google' : 'bing');
}
function setPhotoreal(v) { photorealOn.value = v; loadPhotoreal(v); }
async function setGeoJson(v) {
  geojsonOn.value = v;
  if (!viewer) return;
  if (!geoDs && v) {
    try {
      const ds = await Cesium.GeoJsonDataSource.load('/geoData/中国_省.geojson', {
        stroke: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.85),
        strokeWidth: 1.2,
        fill: Cesium.Color.fromCssColorString('#1e6fbe').withAlpha(0.22),
        clampToGround: false,
      });
      geoDs = viewer.dataSources.add(ds);
    } catch (e) {
      console.warn('[sandbox] GeoJSON 加载失败', e);
    }
  }
  if (geoDs) geoDs.show = v;
}
function setCity(v) {
  cityOn.value = v;
  for (const e of buildingEntities) e.show = v;
}
function setDrone(v) { droneOn.value = v; if (droneEntity) droneEntity.show = v; }

/* 图层开关映射列表(template 复用) */
const layerRows = [
  { key: 'osm', label: 'OSM 全球三维建筑', get: () => osmOn.value, set: setOsm },
  { key: 'terrain', label: 'Cesium 世界地形(高程)', get: () => terrainOn.value, set: setTerrainOnHandler },
  { key: 'google', label: 'Google 卫星影像(2D)', get: () => googleImageryOn.value, set: setGoogleImagery },
  { key: 'photoreal', label: 'Google 写实 3D 场景', get: () => photorealOn.value, set: setPhotoreal },
  { key: 'city', label: '程序生成:京城夜景城市', get: () => cityOn.value, set: setCity },
  { key: 'drone', label: '无人机轨迹仿真', get: () => droneOn.value, set: setDrone },
  { key: 'geojson', label: '中国省界 GeoJSON', get: () => geojsonOn.value, set: setGeoJson },
];

/* ===================== 粒子 ===================== */
function setParticleMode(key) {
  particleMode.value = key;
}
function onSceneClick(movement) {
  if (particleMode.value === 'off') return;
  const scene = viewer.scene;
  let pos = undefined;
  try {
    pos = scene.pickPosition(movement.position);
  } catch (e) { /* ignore */ }
  if (!Cesium.defined(pos)) {
    pos = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
  }
  if (!Cesium.defined(pos)) return;
  spawnParticle(particleMode.value, pos);
}

function spawnParticle(kind, pos) {
  const scene = viewer.scene;
  const carto = Cesium.Cartographic.fromCartesian(pos);
  const surfaceH = carto.height;

  const removeAfter = (sys, ms) => {
    setTimeout(() => {
      scene.primitives.remove(sys);
      if (sys && !sys.isDestroyed()) sys.destroy();
    }, ms);
  };

  if (kind === 'smoke') {
    const up = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, surfaceH + 8);
    const sys = new Cesium.ParticleSystem({
      image: TEX.smoke,
      startColor: Cesium.Color.WHITE.withAlpha(0.9),
      endColor: Cesium.Color.fromCssColorString('#3a3a3a').withAlpha(0.02),
      startScale: 0.4,
      endScale: 12,
      particleSize: 3,
      sizeInMeters: true,
      emissionRate: 60,
      lifetime: 18,
      emitter: new Cesium.SphereEmitter(3),
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(up),
      gravity: 5,
      updateCallback(particle, dt) {
        // 缓慢上升 + 扩散
        particle.velocity = Cesium.Cartesian3.add(
          particle.velocity,
          new Cesium.Cartesian3(0.6, 0.4, 1.4) * dt,
          new Cesium.Cartesian3()
        );
      },
    });
    scene.primitives.add(sys);
    removeAfter(sys, 18000);
  } else if (kind === 'fire') {
    const up = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, surfaceH + 4);
    const sys = new Cesium.ParticleSystem({
      image: TEX.fire,
      startColor: Cesium.Color.fromCssColorString('#ffdf9d').withAlpha(1),
      endColor: Cesium.Color.fromCssColorString('#c23b00').withAlpha(0),
      startScale: 0.3,
      endScale: 1.4,
      particleSize: 2.2,
      sizeInMeters: true,
      emissionRate: 200,
      lifetime: 6,
      gravity: -1.2,
      emitter: new Cesium.SphereEmitter(0.9),
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(up),
      updateCallback(particle, dt) {
        particle.velocity.z = Math.min(30, particle.velocity.z + 6 * dt);
      },
    });
    scene.primitives.add(sys);
    removeAfter(sys, 9000);
  } else if (kind === 'explosion') {
    const up = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, surfaceH + 6);
    const sys = new Cesium.ParticleSystem({
      image: TEX.spark,
      startColor: Cesium.Color.fromCssColorString('#fff6d8'),
      endColor: Cesium.Color.fromCssColorString('#ff7a00').withAlpha(0),
      startScale: 1.6,
      endScale: 0.25,
      particleSize: 1.6,
      sizeInMeters: true,
      emissionRate: 0,
      lifetime: 9,
      emitter: new Cesium.SphereEmitter(0.1),  // 起点集中
      bursts: [new Cesium.ParticleBurst({ time: 0.0, minimum: 240, maximum: 340 })],
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(up),
      updateCallback(particle, dt) {
        // 径向爆开 + 重力回落
        particle.velocity = Cesium.Cartesian3.multiplyByScalar(particle.velocity, 0.985, new Cesium.Cartesian3());
        particle.velocity.z -= 3.2 * dt;
      },
    });
    scene.primitives.add(sys);
    removeAfter(sys, 8000);
  } else if (kind === 'fireworks') {
    // 主升空焰弹
    const base = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, surfaceH + 10);
    // 多层爆炸,每层一个系统
    const layers = 6;
    for (let i = 0; i < layers; i++) {
      const offLon = carto.longitude + (Math.random() - 0.5) * 0.02;
      const offLat = carto.latitude + (Math.random() - 0.5) * 0.02;
      const alt = surfaceH + 120 + Math.random() * 160;
      const pos = Cesium.Cartesian3.fromRadians(offLon, offLat, alt);
      const hue = Math.random();
      const sys = new Cesium.ParticleSystem({
        image: TEX.spark,
        startColor: Cesium.Color.fromHsl(hue, 1, 0.68),
        endColor: Cesium.Color.WHITE.withAlpha(0.1),
        startScale: 1.1,
        endScale: 0.25,
        particleSize: 1.4,
        sizeInMeters: true,
        emissionRate: 0,
        lifetime: 4,
        emitter: new Cesium.SphereEmitter(0.05),
        bursts: [new Cesium.ParticleBurst({ time: 0.0, minimum: 160, maximum: 240 })],
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(pos),
        updateCallback(particle, dt) {
          particle.velocity = Cesium.Cartesian3.multiplyByScalar(particle.velocity, 0.975, new Cesium.Cartesian3());
          particle.velocity.z -= 1.8 * dt;
        },
      });
      scene.primitives.add(sys);
      removeAfter(sys, 6500);
    }
  }
}

/* ===================== HUD / 交互 ===================== */
function frameTick() {
  rafId = requestAnimationFrame(frameTick);
  const now = performance.now();
  const dt = now - lastFrame;
  lastFrame = now;
  fpsAcc += dt;
  fpsFrames++;
  if (fpsAcc >= 500) {
    fpsText.value = ((fpsFrames * 1000) / fpsAcc).toFixed(0);
    frameMsText.value = (fpsAcc / fpsFrames).toFixed(1);
    fpsAcc = 0;
    fpsFrames = 0;
  }

  if (viewer && viewer.scene && viewer.canvas) {
    const c = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
    lonText.value = Cesium.Math.toDegrees(c.longitude).toFixed(3);
    latText.value = Cesium.Math.toDegrees(c.latitude).toFixed(3);
    altText.value = Math.max(0, Math.round(c.height));
    tileQueue.value = viewer.scene.globe.tileLoadQueueLength;
    entityCount.value = viewer.entities.values.length;
    clockText.value = Cesium.JulianDate.toDate(viewer.clock.currentTime).toISOString().slice(11, 16) + 'Z';
  }
}

function togglePlay() {
  playing.value = !playing.value;
  if (viewer) viewer.clock.shouldAnimate = playing.value;
}
function resetClock() {
  if (viewer) viewer.clock.currentTime = viewer.clock.startTime.clone();
}
function flyTo(p) {
  if (!viewer) return;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.h),
    orientation: {
      heading: 0,
      pitch: -Cesium.Math.PI_OVER_TWO * 0.82,
      roll: 0,
    },
    duration: 2.4,
  });
}
function flyHome() { flyTo(presets[0]); }
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}
function snapshot() {
  if (!viewer) return;
  viewer.render();
  const data = viewer.canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = data;
  a.download = `sandbox-${Date.now()}.png`;
  a.click();
}
</script>

<style scoped>
/* ============ 容器 ============ */
.sandbox-view {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #07111f;
  color: #dce6f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.globe { position: absolute; inset: 0; }

/* Cesium 控件微调 */
.sandbox-view :deep(.cesium-widget) { position: absolute; inset: 0; }
.sandbox-view :deep(.cesium-viewer) { position: absolute; inset: 0; }
.sandbox-view :deep(.cesium-viewer-toolbar) { display: none; }
.sandbox-view :deep(.cesium-viewer-animationContainer),
.sandbox-view :deep(.cesium-viewer-timelineContainer) { display: none; }
.sandbox-view :deep(.cesium-widget-credits) {
  left: auto !important;
  right: 2px !important;
  bottom: 2px !important;
  font-size: 10px !important;
  color: rgba(255, 255, 255, 0.4);
  background: none;
}
.sandbox-view :deep(.cesium-performanceDisplay-defaultContainer) { display: none; }

/* ============ HUD ============ */
.hud { position: absolute; pointer-events: none; user-select: none; z-index: 10; }
.hud-top {
  top: 14px;
  left: 12px;
  margin-left: 96px;
  padding: 10px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(8, 20, 40, 0.72), rgba(10, 12, 30, 0.5));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(90, 150, 255, 0.2);
  max-width: 420px;
}
.hud-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #7fd4ff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.hud-title .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #2effa9;
  box-shadow: 0 0 8px #2effa9;
  animation: pulse 1.6s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.hud-line {
  font-size: 11px;
  color: #b9ccdf;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 2px;
}
.hud-line b { color: #fff; font-weight: 700; }
.hud-line .dim { opacity: 0.6; }
.mono { font-family: 'Cascadia Code', Consolas, monospace; }

.hud-actions {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  display: flex;
  gap: 8px;
}
.btn-hud {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(10, 20, 40, 0.65);
  color: #dfe9ff;
  padding: 8px 13px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.15s;
}
.btn-hud:hover { background: rgba(40, 80, 160, 0.5); border-color: rgba(127, 212, 255, 0.6); }
.btn-hud.accent { background: linear-gradient(135deg, #2563eb, #7c3aed); border-color: transparent; }

/* ============ 控制台 ============ */
.console {
  position: absolute;
  left: 12px;
  top: 100px;
  bottom: 46px;
  width: 336px;
  z-index: 11;
  display: flex;
  flex-direction: column;
  background: rgba(6, 14, 28, 0.76);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(90, 150, 255, 0.22);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  transition: width 0.2s;
}
.console.collapse { width: 46px; }
.console-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.console.collapse .console-header { border-bottom: none; padding: 10px 14px; }
.console.collapse .console-title,
.console.collapse .console-body { display: none; }
.console-icon { font-size: 15px; }
.console-title { font-weight: 700; font-size: 13px; color: #cfe4ff; letter-spacing: 1px; flex: 1; }
.console-toggle { color: #6f8ab0; font-size: 12px; }
.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 16px;
}
.console-body::-webkit-scrollbar { width: 5px; }
.console-body::-webkit-scrollbar-thumb { background: rgba(120, 160, 255, 0.3); border-radius: 3px; }

.panel { margin-bottom: 16px; }
.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #a5c7ff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.panel-title .hint { font-weight: 400; color: #6f86ad; font-size: 10px; }

.ctrl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 7px 0;
  font-size: 12px;
}
.ctrl .label { color: #d2dff2; flex: 1; }
.ctrl .hint { color: #6677a0; font-size: 10px; font-weight: 400; }
.ctrl em { color: #7fd4ff; font-style: normal; }
.ctrl .mono { color: #ffd479; }
.ctrl .ctrl-right { display: flex; align-items: center; gap: 8px; }
input[type='range'] { flex: 1; min-width: 0; accent-color: #2f6bff; background: transparent; }
input[type='range']:disabled { opacity: 0.4; }

/* 自定义 switch */
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex: none;
}
.switch input { opacity: 0; width: 0; height: 0; }
.switch .track {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  transition: all 0.18s;
}
.switch .track::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  top: 2px;
  left: 3px;
  background: #bcd6ff;
  transition: all 0.18s;
}
.switch input:checked + .track {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-color: rgba(160, 180, 255, 0.6);
}
.switch input:checked + .track::before {
  left: 19px;
  background: #fff;
}

.sel {
  background: #0b1b36;
  color: #d8e6ff;
  border: 1px solid rgba(100, 160, 255, 0.3);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  width: 100%;
}

.btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px; }
.btn-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #cfe0ff;
  font-size: 12px;
  padding: 6px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}
.btn-chip:hover { background: rgba(90, 150, 255, 0.15); border-color: rgba(125, 212, 255, 0.5); }
.btn-chip.armed {
  background: linear-gradient(135deg, #f20b46, #b3002e) !important;
  border-color: #ff7a9d;
  color: #fff;
  box-shadow: 0 0 14px rgba(255, 30, 80, 0.5);
}
.idle-note {
  color: #ffb56b;
  font-size: 11px;
  margin-top: 8px;
}
.hint-warn { color: #ffb56b; font-size: 11px; margin-top: 4px; }

.console-foot {
  font-size: 10px;
  color: #4f6a93;
  text-align: center;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  margin-top: 6px;
}

/* ============ 底部 ============ */
.hud-bottom {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(8, 18, 38, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(90, 150, 255, 0.22);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
}
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cfe4ff;
  border-radius: 8px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 12px;
}
.btn-ghost:hover { background: rgba(255, 255, 255, 0.08); }
.hud-clock { color: #7fd4ff; min-width: 84px; text-align: center; }

@media (max-width: 900px) {
  .console { width: 300px; }
  .hud-top { margin-left: 48px; max-width: calc(100vw - 260px); }
}
@media (max-width: 620px) {
  .console { left: 8px; right: 8px; width: auto; bottom: auto; max-height: 46vh; }
  .hud-top { display: none; }
}
</style>