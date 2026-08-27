<template>
  <div class="engine-root">
    <div ref="mountRef" class="mount"></div>
    <div class="crosshair" v-if="camMode === 'first'"></div>

    <!-- 顶栏: FPS + UI 切换 -->
    <div class="topbar">
      <button class="chip ui-toggle" @click="toggleUI">{{ showUI ? '👁 UI 隐藏' : '👁 UI 显示' }}</button>
      <div class="fps">⚡ {{ fps.toFixed(1) }} fps</div>
    </div>

    <!-- 按键提示(始终显示) -->
    <div class="help">
      <div><b>W A S D</b> 移动</div>
      <div><b>鼠标</b> 视角</div>
      <div><b>Shift</b> 疾跑</div>
      <div><b>空格</b> 跳跃</div>
      <div><b>C</b> 切视角</div>
      <div><b>左键</b> 放方块</div>
      <div><b>右键</b> 丢光球</div>
      <div><b>H</b> 切换UI</div>
    </div>

    <!-- 可隐藏的 UI -->
    <template v-if="showUI">
      <!-- 左侧: 视角切换 + 快捷操作 -->
      <div class="leftbar">
        <button class="chip" :class="{ on: camMode === 'third' }" @click="setCamMode('third')">第三人称</button>
        <button class="chip" :class="{ on: camMode === 'first' }" @click="setCamMode('first')">第一人称</button>
        <button class="chip" @click="resetPlayer">↺ 重置</button>
        <button class="chip" @click="duskShot">🌇 落日</button>
      </div>

      <!-- 右侧: 控制台 -->
      <div class="console">
      <section class="panel">
        <div class="ptitle">🌤 环境</div>
        <div class="ctrl">
          <span class="label">时刻（日出→深夜）</span>
          <input type="range" min="5" max="23" step="0.5" :value="sunHour" @input="onSunHour" />
        </div>
        <div class="ctrl">
          <span class="label">雾浓度</span>
          <input type="range" min="0" max="0.003" step="0.0001" :value="fogDensity" @input="onFog" />
        </div>
        <div class="ctrl">
          <span class="label">阴影</span>
          <label class="switch"><input type="checkbox" :checked="shadowOn" @change="setShadow($event.target.checked)" /><span class="slider"></span></label>
        </div>
        <div class="ctrl">
          <span class="label">夜间霓虹</span>
          <label class="switch"><input type="checkbox" :checked="neonOn" @change="setNeon($event.target.checked)" /><span class="slider"></span></label>
        </div>
      </section>

      <section class="panel">
        <div class="ptitle">✨ 后处理</div>
        <div class="ctrl">
          <span class="label">Bloom 泛光</span>
          <label class="switch"><input type="checkbox" :checked="bloomOn" @change="setBloom($event.target.checked)" /><span class="slider"></span></label>
        </div>
        <div class="ctrl">
          <span class="label">曝光</span>
          <input type="range" min="0.3" max="3" step="0.05" :value="exposure" @input="onExposure" />
        </div>
        <div class="ctrl">
          <span class="label">Tonemapper</span>
          <select :value="tonemapper" @change="onTonemapper">
            <option value="neutral">PBR Neutral</option>
            <option value="aces">ACES</option>
            <option value="filmic">Filmic</option>
            <option value="none">None</option>
          </select>
        </div>
      </section>

      <section class="panel">
        <div class="ptitle">📌 世界状态</div>
        <div class="stat row"><span>位置</span><b>({{ pos.x.toFixed(0) }}, {{ pos.y.toFixed(0) }}, {{ pos.z.toFixed(0) }})</b></div>
        <div class="stat row"><span>朝向</span><b>{{ headingText }}</b></div>
        <div class="stat row"><span>速度</span><b>{{ speed.toFixed(1) }} m/s</b></div>
        <div class="stat row"><span>放置方块</span><b>{{ entities }}</b></div>
        <div class="stat row"><span>光球</span><b>{{ balls }}</b></div>
      </section>
    </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const mountRef = ref(null)
let viewer = null
let lastTick = performance.now()
let fpsWindow = 0 // 首次 tick 时初始化
let frameCount = 0
let hudEvery = 0
const keys = new Set()

const camMode = ref('third')
const showUI = ref(true)
function toggleUI() {
  showUI.value = !showUI.value
  document.body.classList.toggle('ui-hidden', !showUI.value)
}
const sunHour = ref(13)
const fogDensity = ref(0.0008)
const shadowOn = ref(true)
const neonOn = ref(false)
const bloomOn = ref(true)
const exposure = ref(1.2)
const tonemapper = ref('neutral')
const pos = ref({ x: 0, y: 0, z: 0 })
const speed = ref(0)
const entities = ref(0)
const balls = ref(0)
const headingText = ref('N')
const fps = ref(0)

/* ============ 本地世界坐标(+x 东,+z 北,y 高),ENU ↔ 地心 ============ */
const ORIGIN = Cesium.Cartesian3.fromDegrees(116.3983, 39.9135)
const ENU = Cesium.Transforms.eastNorthUpToFixedFrame(ORIGIN)
const ENU_INV = Cesium.Matrix4.inverse(ENU, new Cesium.Matrix4())
function lg(p) { return Cesium.Matrix4.multiplyByPoint(ENU, p, new Cesium.Cartesian3()) }
// 世界坐标: 全部用 fromDegrees, 与地面 Rectangle 完全一致
function wpos(x, y, z) {
  const cosLat = Math.cos(39.9135 * Math.PI / 180)
  return Cesium.Cartesian3.fromDegrees(116.3983 + x / (111320 * cosLat), 39.9135 + z / 110542, y)
}
function toRadLon(x) { return Cesium.Math.toRadians(116.3983 + x / (111320 * Math.cos(Cesium.Math.toRadians(39.9135)))) }
function toRadLat(z) { return Cesium.Math.toRadians(39.9135 + z / 110542) }
function myRect(x0, z0, x1, z1) { return new Cesium.Rectangle(toRadLon(x0), toRadLat(z0), toRadLon(x1), toRadLat(z1)) }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }

/* ============ 玩家 ============ */
const player = { x: 0, z: 0, y: 2.5, vy: 0, yaw: 0, camPitch: -0.55, radius: 0.45, height: 1.7 }
let playerBody = null, playerHead = null, playerNose = null
const colliders = []     // {x,z,w,d,h}
const placedBoxes = []   // {x,z,h}
const ballObjs = []      // {x,y,z,vx,vy,vz,e}

let mouseLastX = 0, mouseLastY = 0
const WORLD = 180
const GRAVITY = -19.6
const WALK = 5.2, SPRINT = 8.4, JUMP_V = 8.8
const BALL_MAX = 36, BOX_MAX = 180
let jumpLock = false
let lastHx = 0, lastHz = 0, lastHudT = performance.now()

/* ============ 程序化纹理 ============ */
function texCanvas(w, h, drawFn) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  drawFn(cv.getContext('2d'), w, h)
  return cv
}
const NEONS = ['#ff5bd0', '#39e8ff', '#ffd166', '#b28dff', '#5affc7']
let texGround = null, texWall = null
let groundEntity = null
function buildTextures() {
  texGround = texCanvas(512, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#3a6a3a'); grad.addColorStop(0.5, '#4a7a4a'); grad.addColorStop(1, '#3a6a3a')
    g.fillStyle = grad; g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3
    for (let i = 0; i <= 16; i++) { const p = i * w / 16; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke() }
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1
    for (let i = 0; i < w; i += 16) for (let j = 0; j < h; j += 16) g.strokeRect(i + .5, j + .5, 16, 16)
  })
  texWall = texCanvas(128, 128, (g) => {
    g.fillStyle = '#8892a4'; g.fillRect(0, 0, 128, 128)
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.strokeRect(c * 32 + 8, r * 32 + 8, 16, 16) }
    g.fillStyle = 'rgba(150,200,255,0.35)'
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.fillRect(c * 32 + 10, r * 32 + 10, 12, 12)
  })
}

/* ============ 世界搭建 ============ */
function addGround() {
  groundEntity = viewer.entities.add({
    rectangle: {
      coordinates: myRect(-150, -150, 150, 150),
      material: new Cesium.ImageMaterialProperty({ image: texGround }),
      height: 0.05,
      shadows: Cesium.ShadowMode.RECEIVE_ONLY,
    },
  })
}
function addBuildings() {
  let seed = 42
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const palette = ['#b8c4d4', '#8f9bb0', '#d2c9b0', '#a8b5a0', '#c0a8c0', '#b4c8d8', '#c8d0dc', '#9ba8b8']
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const x = i * 36 + rnd() * 6 - 3
    const z = j * 36 + rnd() * 6 - 3
    if (Math.abs(x) < 14 && Math.abs(z) < 14) continue // 中央留空
    const h = 8 + rnd() * 35
    const w = 10 + rnd() * 6
    const d = 10 + rnd() * 6
    viewer.entities.add({
      position: wpos(x, h / 2, z),
      box: {
        dimensions: new Cesium.Cartesian3(w, d, h), // x=width, y=depth, z=height ✓
        material: new Cesium.ImageMaterialProperty({ image: texWall }),
        shadows: Cesium.ShadowMode.ENABLED,
      },
    })
    colliders.push({ x, z, w, d, h })
  }
}
function addTrees() {
  let seed = 7
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647 }
  let made = 0
  while (made < 30) {
    const x = rnd() * 280 - 140
    const z = rnd() * 280 - 140
    if (Math.abs(x) < 16 && Math.abs(z) < 16) continue
    if (colliders.some(cb => Math.abs(x - cb.x) < cb.w / 2 + 2 && Math.abs(z - cb.z) < cb.d / 2 + 2)) continue
    const h = 2.5 + rnd() * 2
    const s = 1.2 + rnd() * 0.8
    viewer.entities.add({ position: wpos(x, h / 2, z), cylinder: newCyl(h, 0.14, 0.22, '#6b4a2f') })
    viewer.entities.add({ position: wpos(x, h + s * 0.7, z), ellipsoid: { radii: new Cesium.Cartesian3(s, s, s * 0.8), material: Cesium.Color.fromCssColorString(rnd() > 0.5 ? '#3f8f4c' : '#58a25a'), shadows: Cesium.ShadowMode.ENABLED } })
    colliders.push({ x, z, w: 1.5, d: 1.5, h: 1.5 })
    made++
  }
}
function addBoundary() {
  const post = (px, pz) => {
    viewer.entities.add({ position: wpos(px, 2.6, pz), cylinder: newCyl(5.2, 0.12, 0.2, '#31314a') })
    viewer.entities.add({ position: wpos(px, 5.8, pz), ellipsoid: { radii: new Cesium.Cartesian3(0.28, 0.28, 0.28), material: Cesium.Color.RED, shadows: Cesium.ShadowMode.DISABLED } })
  }
  for (let i = -150; i <= 150; i += 60) {
    post(-150, i); post(150, i)
    post(i, -150); post(i, 150)
  }
  // 四角大灯塔
  for (const [cx, cz] of [[-154, -154], [154, -154], [-154, 154], [154, 154]]) {
    viewer.entities.add({ position: wpos(cx, 9, cz), cylinder: newCyl(18, 0.3, 0.5, '#22222f') })
  }
}
function newCyl(h, tr, br, hex) { return { height: h, topRadius: tr, bottomRadius: br, material: Cesium.Color.fromCssColorString(hex), shadows: Cesium.ShadowMode.DISABLED } }

/* ============ 角色 ============ */
let charParts = []
function buildCharacter() {
  // 精确的人形角色(用 Cesium 基本几何体搭建)
  const skin = Cesium.Color.fromCssColorString('#ffcc99')
  const shirt = Cesium.Color.fromCssColorString('#4488cc')
  const pants = Cesium.Color.fromCssColorString('#333355')
  const shoe = Cesium.Color.fromCssColorString('#222222')
  const hair = Cesium.Color.fromCssColorString('#553322')

  const add = (posFn, geom) => {
    const e = viewer.entities.add({ position: new Cesium.CallbackProperty(posFn, false), ...geom })
    charParts.push(e)
    return e
  }

  const p = () => player
  // 躯干
  add(() => wpos(p().x, p().y + 1.1, p().z), { box: { dimensions: new Cesium.Cartesian3(0.4, 0.3, 0.6), material: shirt, shadows: Cesium.ShadowMode.ENABLED } })
  // 头部
  add(() => wpos(p().x, p().y + 1.65, p().z), { ellipsoid: { radii: new Cesium.Cartesian3(0.2, 0.2, 0.22), material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  // 头发
  add(() => wpos(p().x, p().y + 1.78, p().z), { ellipsoid: { radii: new Cesium.Cartesian3(0.2, 0.2, 0.1), material: hair, shadows: Cesium.ShadowMode.DISABLED } })
  // 左腿
  add(() => wpos(p().x - 0.12, p().y + 0.35, p().z), { cylinder: { length: 0.7, topRadius: 0.08, bottomRadius: 0.1, material: pants, shadows: Cesium.ShadowMode.ENABLED } })
  // 右腿
  add(() => wpos(p().x + 0.12, p().y + 0.35, p().z), { cylinder: { length: 0.7, topRadius: 0.08, bottomRadius: 0.1, material: pants, shadows: Cesium.ShadowMode.ENABLED } })
  // 左臂
  add(() => wpos(p().x - 0.28, p().y + 1.2, p().z), { cylinder: { length: 0.6, topRadius: 0.06, bottomRadius: 0.07, material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  // 右臂
  add(() => wpos(p().x + 0.28, p().y + 1.2, p().z), { cylinder: { length: 0.6, topRadius: 0.06, bottomRadius: 0.07, material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  // 左鞋
  add(() => wpos(p().x - 0.12, p().y + 0.05, p().z), { box: { dimensions: new Cesium.Cartesian3(0.15, 0.1, 0.2), material: shoe, shadows: Cesium.ShadowMode.DISABLED } })
  // 右鞋
  add(() => wpos(p().x + 0.12, p().y + 0.05, p().z), { box: { dimensions: new Cesium.Cartesian3(0.15, 0.1, 0.2), material: shoe, shadows: Cesium.ShadowMode.DISABLED } })

  playerBody = charParts[0] // 保持兼容
  playerHead = charParts[1]
  playerNose = charParts[2]
}

/* ============ 地面高度(站得上的平台) ============ */
function groundHeight(x, z) {
  let top = 0.05
  for (const b of placedBoxes) {
    if (Math.abs(x - b.x) < 1.0 && Math.abs(z - b.z) < 1.0) top = Math.max(top, b.h + 1.5)
  }
  return top
}

/* ============ 交互 ============ */
function placeAtScreen(clientX, clientY) {
  if (!viewer) return
  const rect = viewer.canvas.getBoundingClientRect()
  const canvasX = clientX - rect.left
  const canvasY = clientY - rect.top
  if (canvasX < 0 || canvasY < 0 || canvasX > rect.width || canvasY > rect.height) return
  // 用 scene.pickPosition 获取点击位置的精确 3D 坐标(地面/方块/建筑表面)
  const picked = viewer.scene.pickPosition(new Cesium.Cartesian2(canvasX, canvasY))
  if (!picked) return
  // 转到本地坐标
  const local = Cesium.Matrix4.multiplyByPoint(ENU_INV, picked, new Cesium.Cartesian3())
  const x = local.x, z = local.y
  if (Math.abs(x) > WORLD - 4 || Math.abs(z) > WORLD - 4) return
  if (placedBoxes.length >= BOX_MAX) {
    const old = placedBoxes.shift()
    viewer.entities.remove(old.e)
  }
  const color = Cesium.Color.fromCssColorString(NEONS[Math.floor(Math.random() * NEONS.length)])
  const boxData = { x, z, h: groundHeight(x, z) || 0.05, e: null }
  const SIZE = 1.5
  const e = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => wpos(boxData.x, boxData.h + SIZE / 2, boxData.z), false),
    box: { dimensions: new Cesium.Cartesian3(SIZE, SIZE, SIZE), material: color, shadows: Cesium.ShadowMode.ENABLED },
  })
  boxData.e = e
  placedBoxes.push(boxData)
  // 添加碰撞,让玩家不能穿过方块
  colliders.push({ x, z, w: SIZE, d: SIZE, h: boxData.h + SIZE })
}
function throwBall() {
  if (ballObjs.length >= BALL_MAX) {
    const old = ballObjs.shift()
    viewer.entities.remove(old.e)
  }
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
  const bx = { x: player.x + fx * 0.8, y: player.y + 1.5, z: player.z + fz * 0.8, vx: fx * 12, vy: 5.5, vz: fz * 12, e: null }
  bx.e = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => wpos(bx.x, bx.y, bx.z), false),
    ellipsoid: { radii: new Cesium.Cartesian3(0.22, 0.22, 0.22), material: Cesium.Color.fromCssColorString('#ffe16b'), shadows: Cesium.ShadowMode.DISABLED },
  })
  ballObjs.push(bx)
}

/* ============ 物理帧 ============ */
function updatePlayer(dt) {
  const fwd = (keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0
  const back = (keys.has('KeyS') || keys.has('ArrowDown')) ? 1 : 0
  const left = (keys.has('KeyA') || keys.has('ArrowLeft')) ? 1 : 0
  const right = (keys.has('KeyD') || keys.has('ArrowRight')) ? 1 : 0
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight')
  const spd = (sprint ? SPRINT : WALK)
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
  const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw)
  let mx = (fwd - back) * fx + (right - left) * rx
  let mz = (fwd - back) * fz + (right - left) * rz
  const mlen = Math.hypot(mx, mz)
  if (mlen > 0) {
    player.x += (mx / mlen) * spd * dt
    player.z += (mz / mlen) * spd * dt
  }
  // 跳跃
  if (keys.has('Space')) {
    if (!jumpLock && player.y <= groundHeight(player.x, player.z) + 0.05) {
      player.vy = JUMP_V
      jumpLock = true
    }
  } else jumpLock = false
  // 重力
  player.vy += GRAVITY * dt
  player.y += player.vy * dt
  const gy = groundHeight(player.x, player.z)
  if (player.y <= gy) {
    player.y = gy
    if (player.vy < -18) player.vy = -2 * 0.3 // 软着陆
    else player.vy = 0
  }
  // 建筑碰撞
  for (const cb of colliders) {
    const hw = cb.w / 2 + player.radius
    const hd = cb.d / 2 + player.radius
    if (player.y < cb.h && Math.abs(player.x - cb.x) < hw && Math.abs(player.z - cb.z) < hd) {
      const px = hw - Math.abs(player.x - cb.x)
      const pz = hd - Math.abs(player.z - cb.z)
      if (px < pz) player.x = cb.x + Math.sign(player.x - cb.x) * hw
      else player.z = cb.z + Math.sign(player.z - cb.z) * hd
    }
  }
  // 世界边界
  player.x = clamp(player.x, -WORLD, WORLD)
  player.z = clamp(player.z, -WORLD, WORLD)
}
function updateBalls(dt) {
  for (const b of ballObjs) {
    b.vy += GRAVITY * dt
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt
    if (b.y < 0.22) { b.y = 0.22; b.vy = Math.abs(b.vy) * 0.55 }
    if (Math.abs(b.x) > WORLD - 2) { b.vx = -b.vx * 0.6; b.x = clamp(b.x, -WORLD + 2, WORLD - 2) }
    if (Math.abs(b.z) > WORLD - 2) { b.vz = -b.vz * 0.6; b.z = clamp(b.z, -WORLD + 2, WORLD - 2) }
    // 与光柱上沿简易: 直接忽略
  }
}

/* ============ 相机 ============ */
function updateCamera() {
  const c = viewer.camera
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
  if (camMode.value === 'third') {
    const dist = 10
    const eyeY = player.y + 5.5
    // 动态计算俯角:让相机始终看着玩家身体(不是地板)
    const lookPitch = Math.atan2(-(eyeY - (player.y + 1.2)), dist)
    c.setView({
      destination: wpos(player.x - fx * dist, eyeY, player.z - fz * dist),
      orientation: { heading: player.yaw, pitch: lookPitch + player.camPitch * 0.3, roll: 0 },
    })
  } else {
    c.setView({
      destination: wpos(player.x, player.y + 1.6, player.z),
      orientation: { heading: player.yaw, pitch: player.camPitch, roll: 0 },
    })
  }
}

/* ============ 主循环 ============ */
let tickHandler = null
function tick() {
  window.__ticks = (window.__ticks || 0) + 1
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTick) / 1000 || 0.016)
  lastTick = now
  updatePlayer(dt)
  updateBalls(dt)
  updateCamera()
  frameCount++
  if (!fpsWindow) { fpsWindow = now; lastHudT = now } // 首次初始化
  if (now - fpsWindow >= 500) {
    fps.value = Math.round(frameCount * 1000 / (now - fpsWindow))
    frameCount = 0; fpsWindow = now
    const hdt = (now - lastHudT) / 1000
    if (hdt > 0 && hdt < 2) speed.value = Math.hypot(player.x - lastHx, player.z - lastHz) / hdt
    lastHx = player.x; lastHz = player.z; lastHudT = now
    pos.value = { x: player.x, y: player.y, z: player.z }
    const deg = ((player.yaw * 180 / Math.PI) % 360 + 360) % 360
    headingText.value = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.round(deg / 45) % 8]
    entities.value = placedBoxes.length
    balls.value = ballObjs.length
    // 微任务延迟,确保在 Vue 模板渲染后执行
    Promise.resolve().then(() => {
      const fpsEl = document.querySelector('.fps')
      if (fpsEl) fpsEl.textContent = '⚡ ' + fps.value + ' fps'
    })
  }
}

/* ============ 事件 ============ */
function onKeyDown(e) {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault()
  keys.add(e.code)
  if (e.code === 'KeyC') toggleCam()
  if (e.code === 'KeyH') toggleUI()
}
function onKeyUp(e) { keys.delete(e.code) }
function onMouseMove(e) {
  const dx = e.clientX - mouseLastX
  const dy = e.clientY - mouseLastY
  mouseLastX = e.clientX; mouseLastY = e.clientY
  player.yaw = (player.yaw + dx * 0.0042) % (Math.PI * 2)
  player.camPitch = clamp(player.camPitch - dy * 0.0032, -1.0, 0.8)
}
let ssEventHandler = null
function onCanvasClick(e) { placeAtScreen(e.clientX, e.clientY) }
function onCanvasContext(e) { e.preventDefault(); throwBall() }

/* ============ 控制 ============ */
function toggleCam() { setCamMode(camMode.value === 'third' ? 'first' : 'third') }
function setCamMode(m) {
  camMode.value = m
  const show = m !== 'first'
  charParts.forEach(cp => { cp.show = show })
}
function resetPlayer() {
  player.x = 0; player.z = 0; player.y = 2.5; player.vy = 0; player.yaw = -Math.PI / 4
  updateCamera()
}
function duskShot() {
  sunHour.value = 18.5
  applySun()
  resetPlayer()
  viewer.camera.flyTo({ destination: wpos(0, 46, 64), orientation: { heading: 0.5, pitch: -0.4, roll: 0 } })
}
function applySun() {
  if (!viewer) return
  const hh = Math.floor(sunHour.value)
  const mm = Math.round((sunHour.value - hh) * 60)
  const pad = (n) => String(n).padStart(2, '0')
  viewer.clock.currentTime = Cesium.JulianDate.addSeconds(
    Cesium.JulianDate.fromDate(new Date('2026-06-21T' + pad(hh) + ':' + pad(mm) + ':00Z')),
    0, new Cesium.JulianDate()
  )
}
function onSunHour(e) { sunHour.value = parseFloat(e.target.value); applySun() }
function onFog(e) {
  fogDensity.value = parseFloat(e.target.value)
  if (viewer) {
    viewer.scene.fog.enabled = fogDensity.value > 0.0001
    viewer.scene.fog.density = fogDensity.value
  }
}
function setShadow(v) {
  shadowOn.value = v
  if (viewer) viewer.shadows = v
}
function setNeon(v) {
  neonOn.value = v
  if (!viewer) return
  if (v) {
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#050510')
    viewer.scene.fog.color = Cesium.Color.fromCssColorString('#0a1030')
    viewer.scene.fog.enabled = true
    viewer.scene.fog.density = 0.003
    viewer.scene.postProcessStages.bloom.enabled = true
    viewer.scene.postProcessStages.bloom.threshold = 0.4
    viewer.scene.postProcessStages.exposure = 1.5
    sunHour.value = 22; applySun()
    if (groundEntity) groundEntity.rectangle.material = Cesium.Color.fromCssColorString('#111122')
    // 调暗树: 遍历 entities 找椭球体
    viewer.entities.values.forEach(e => {
      if (e.ellipsoid && e.ellipsoid.material) e.ellipsoid.material = Cesium.Color.fromCssColorString('#1a3a1a')
    })
  } else {
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#1a3050')
    viewer.scene.fog.color = Cesium.Color.WHITE
    viewer.scene.fog.density = fogDensity.value
    viewer.scene.fog.enabled = fogDensity.value > 0.0001
    viewer.scene.postProcessStages.bloom.enabled = bloomOn.value
    viewer.scene.postProcessStages.bloom.threshold = 0.9
    viewer.scene.postProcessStages.exposure = exposure.value
    sunHour.value = 13; applySun()
    if (groundEntity) groundEntity.rectangle.material = new Cesium.ImageMaterialProperty({ image: texGround })
    viewer.entities.values.forEach(e => {
      if (e.ellipsoid && e.ellipsoid.material) {
        const c = e.ellipsoid.material.color || e.ellipsoid.material
        e.ellipsoid.material = Cesium.Color.fromCssColorString('#3f8f4c')
      }
    })
  }
}
function setBloom(v) {
  bloomOn.value = v
  if (viewer) {
    viewer.scene.postProcessStages.bloom.enabled = v
    viewer.scene.postProcessStages.bloom.threshold = 0.75
  }
}
function onExposure(e) {
  exposure.value = parseFloat(e.target.value)
  if (viewer) viewer.scene.postProcessStages.exposure = exposure.value
}
function onTonemapper(e) {
  tonemapper.value = e.target.value
  if (viewer) {
    const m = ({ neutral: Cesium.Tonemapper.PBR_NEUTRAL, aces: Cesium.Tonemapper.ACES, filmic: Cesium.Tonemapper.FILMIC, none: Cesium.Tonemapper.NONE })[e.target.value]
    viewer.scene.postProcessStages.tonemapper = m
  }
}

/* ============ 初始化 ============ */
onMounted(async () => {
  try {
  await nextTick()
  // 防御:Cesium 运行版本偶发缺失 setDynamicLighting(预打包不一致时) → 补齐 API
  const SA = Cesium.SkyAtmosphere
  window.__patchInfo = JSON.stringify({
    hasProtoFn: !!(SA && typeof SA.prototype.setDynamicLighting === 'function'),
    hasClass: !!SA,
  })
  if (SA && typeof SA.prototype.setDynamicLighting !== 'function') {
    SA.prototype.setDynamicLighting = function (type) { this.dynamicLighting = type }
  }
  try {
    viewer = new Cesium.Viewer(mountRef.value, {
      animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
      homeButton: false, infoBox: false, sceneModePicker: false,
      navigationHelpButton: false, fullscreenButton: false, selectionIndicator: false,
      imageryProvider: false, baseLayer: false,
      shouldAnimate: true,
      skyAtmosphere: false, skyBox: false,
      creditContainer: document.createElement('div'),
    })
  } catch (eInit) {
    window.__initErr = String(eInit)
    throw eInit
  }
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#1a3050')
  viewer.scene.skyBox = undefined
  viewer.scene.globe.show = false
  const cam3 = viewer.scene.screenSpaceCameraController
  cam3.enableInputs = false; cam3.enableRotate = false; cam3.enableTranslate = false
  cam3.enableZoom = false; cam3.enableTilt = false; cam3.enableLook = false
  viewer.scene.fog.enabled = true
  viewer.scene.fog.density = fogDensity.value
  viewer.shadows = shadowOn.value
  viewer.scene.shadowMap.maximumDistance = 300
  try { viewer.scene.msaaSamples = 4 } catch (e2) { /* older */ }
  viewer.scene.requestRenderMode = false
  viewer.clock.shouldAnimate = true
  // 用 Cesium 时钟 onTick 驱动物理
  viewer.scene.highDynamicRange = true
  viewer.scene.postProcessStages.tonemapper = Cesium.Tonemapper.PBR_NEUTRAL
  viewer.scene.postProcessStages.bloom.enabled = bloomOn.value
  viewer.scene.postProcessStages.bloom.threshold = 0.9
  viewer.scene.postProcessStages.exposure = exposure.value
  viewer.camera.setView({ destination: wpos(0, 44, 78), orientation: { heading: 0.6, pitch: -0.4, roll: 0 } })
  buildCharacter()
  buildTextures()
  addGround(); addBuildings(); addTrees()
  applySun()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  viewer.canvas.addEventListener('click', onCanvasClick)
  viewer.canvas.addEventListener('contextmenu', onCanvasContext)
  lastTick = performance.now()
  lastHudT = performance.now()
  // setInterval 60fps(先清理旧定时器防止累积)
  const oldId = window.__intervalId
  if (oldId) clearInterval(oldId)
  window.__intervalId = setInterval(tick, 16)
  window.__engine = { viewer, player, tickCount: 0 }
  } catch(e) {
    window.__mountErr = String(e.stack || e.message || e)
    console.error('[Engine] mount error:', e)
  }
})

onBeforeUnmount(() => {
  if (window.__intervalId) clearInterval(window.__intervalId)
  window.removeEventListener('keydown', onKeyDown)
  if (viewer && viewer.destroy) viewer.destroy()
  viewer = null
})
</script>

<style scoped>
.engine-root { position: fixed; inset: 0; overflow: hidden; font-family: 'Segoe UI', 'PingFang SC', sans-serif; color: #e8ecf4; user-select: none; }
.mount { position: absolute; inset: 0; }
.mount canvas { outline: none; }
.crosshair { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,80,80,0.9); box-shadow: 0 0 6px rgba(255,0,0,0.8); z-index: 20; pointer-events: none; }
.topbar { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 10px; z-index: 10; pointer-events: none; }
.topbar > * { pointer-events: auto; }
.ui-toggle { font-size: 11px; padding: 3px 8px; opacity: 0.7; }
.ui-toggle:hover { opacity: 1; }
.fps { font-variant-numeric: tabular-nums; font-size: 13px; color: #bdf0a8; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
.leftbar { position: absolute; top: 54px; left: 12px; display: flex; flex-direction: column; gap: 5px; z-index: 10; }
.leftbar .chip { display: block; width: 100%; }
.chip { pointer-events: auto; background: rgba(20,24,38,0.78); border: 1px solid rgba(120,150,255,0.28); color: #d7e4ff; font-size: 12px; padding: 4px 10px; border-radius: 14px; cursor: pointer; }
.chip:hover { background: rgba(50,70,120,0.9); }
.chip.on { background: #3d6bff; border-color: #8fb0ff; color: #fff; }
.help { position: absolute; left: 12px; bottom: 12px; display: grid; grid-template-columns: repeat(3, auto); gap: 4px 16px; z-index: 10; font-size: 12px; color: rgba(255,255,255,0.8); background: rgba(10,14,24,0.55); padding: 8px 12px; border-radius: 10px; backdrop-filter: blur(4px); }
.help b { color: #aad0ff; }
.console { position: absolute; top: 64px; right: 12px; width: 240px; z-index: 10; max-height: calc(100vh - 90px); overflow-y: auto; background: rgba(12,16,28,0.72); border: 1px solid rgba(120,150,230,0.22); border-radius: 12px; padding: 10px 12px; backdrop-filter: blur(6px); }
.console::-webkit-scrollbar { width: 5px; }
.console::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
.panel { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0; }
.panel:last-child { border-bottom: none; }
.ptitle { font-size: 12px; font-weight: 700; color: #ffd9a0; margin-bottom: 8px; letter-spacing: 0.5px; }
.ctrl { margin: 7px 0; }
.ctrl .label { display: block; font-size: 11px; color: rgba(255,255,255,0.7); margin-bottom: 3px; }
.ctrl input[type=range] { width: 100%; accent-color: #5a86ff; }
.ctrl select { width: 100%; background: #1b2136; border: 1px solid rgba(255,255,255,0.2); color: #d3e2ff; border-radius: 6px; padding: 4px; font-size: 12px; }
.switch { position: relative; display: inline-block; width: 38px; height: 20px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch .slider { position: absolute; cursor: pointer; inset: 0; background: #2c3248; border-radius: 20px; transition: 0.2s; }
.switch .slider:before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: #8fa3c8; border-radius: 50%; transition: 0.2s; }
.switch input:checked + .slider { background: #3d6bff; }
.switch input:checked + .slider:before { transform: translateX(18px); background: #fff; }
.stat { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; margin: 4px 0; color: rgba(255,255,255,0.72); }
.stat b { font-variant-numeric: tabular-nums; color: #b8e6ff; }
</style>