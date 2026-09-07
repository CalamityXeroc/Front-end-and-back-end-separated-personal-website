<template>
  <div class="engine-root">
    <div ref="mountRef" class="mount"></div>
    <div class="crosshair" :class="{ locked: pointerLocked }"></div>

    <!-- 顶栏 -->
    <div class="topbar">
      <button class="chip ui-toggle" @click="toggleUI">{{ showUI ? '👁' : '👁' }}</button>
      <div class="fps">⚡ {{ fps.toFixed(0) }} fps</div>
    </div>

    <!-- 底部热键栏 -->
    <div class="hotbar">
      <div v-for="(b, i) in blockTypes" :key="b.key"
        class="slot" :class="{ active: i === selectedSlot }"
        @click="selectedSlot = i"
        :style="{ background: b.color }">
        <span class="slotNum">{{ i + 1 }}</span>
      </div>
    </div>

    <!-- 按键提示 -->
    <div class="help">
      <div><b>W A S D</b> 移动</div>
      <div><b>空格</b> 跳跃</div>
      <div><b>左键</b> 破坏</div>
      <div><b>右键</b> 放置</div>
      <div><b>1-7</b> 选物品</div>
      <div><b>滚轮</b> 切换</div>
      <div><b>点击画面</b> 锁定鼠标</div>
      <div><b>ESC</b> 释放鼠标</div>
      <div><b>C</b> 视角</div>
      <div><b>H</b> 隐藏UI</div>
    </div>

    <!-- 可隐藏的 UI -->
    <template v-if="showUI">
      <div class="leftbar">
        <button class="chip" @click="resetPlayer">↺ 重置</button>
      </div>

      <div class="console">
        <section class="panel">
          <div class="ptitle">🌤 环境</div>
          <div class="ctrl">
            <span class="label">时刻</span>
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
          <div class="ptitle">📌 状态</div>
          <div class="stat row"><span>位置</span><b>({{ pos.x.toFixed(0) }}, {{ pos.y.toFixed(0) }}, {{ pos.z.toFixed(0) }})</b></div>
          <div class="stat row"><span>朝向</span><b>{{ headingText }}</b></div>
          <div class="stat row"><span>方块</span><b>{{ entities }}</b></div>
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
let fpsWindow = 0
let frameCount = 0
let lastHx = 0, lastHz = 0, lastHudT = performance.now()

const camMode = ref('first')
const showUI = ref(true)
const sunHour = ref(13)
const fogDensity = ref(0.0008)
const pos = ref({ x: 0, y: 0, z: 0 })
const speed = ref(0)
const entities = ref(0)
const headingText = ref('N')
const fps = ref(0)
const selectedSlot = ref(0)
const shadowOn = ref(true)
const neonOn = ref(false)
const bloomOn = ref(false)
const exposure = ref(1.2)
const tonemapper = ref('neutral')

/* ============ 方块类型 ============ */
const SIZE = 1.0
function texCanvas(w, h, drawFn) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  drawFn(cv.getContext('2d'), w, h); return cv
}
function rand(g, n) { return Math.floor(Math.random() * n) }
const blockTextures = {}
function makeBlockTex(key, drawFn) {
  blockTextures[key] = texCanvas(64, 64, drawFn)
}

// 草地
makeBlockTex('grass', (g) => {
  g.fillStyle = '#7c9c4c'; g.fillRect(0, 0, 64, 64)
  // 噪点
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${rand(g,40)+80},${rand(g,40)+130},${rand(g,40)+50},0.4)`; g.fillRect(rand(g,64), rand(g,64), 3, 3) }
  // 侧面泥土条
  g.fillStyle = '#8b6914'; g.fillRect(0, 48, 64, 16)
  g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 48, 64, 2)
})
// 泥土
makeBlockTex('dirt', (g) => {
  g.fillStyle = '#8b6914'; g.fillRect(0, 0, 64, 64)
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rand(g,40)+100},${rand(g,30)+70},${rand(g,20)+20},0.5)`; g.fillRect(rand(g,64), rand(g,64), 2, 2) }
})
// 石头
makeBlockTex('stone', (g) => {
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, 64, 64)
  for (let i = 0; i < 150; i++) { const v = rand(g,40)+90; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rand(g,64), rand(g,64), rand(g,6)+2, rand(g,6)+2) }
  for (let i = 0; i < 10; i++) { g.strokeStyle = 'rgba(0,0,0,0.2)'; g.strokeRect(rand(g,50), rand(g,50), 10, 10) }
})
// 木板
makeBlockTex('plank', (g) => {
  g.fillStyle = '#bc9862'; g.fillRect(0, 0, 64, 64)
  for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.moveTo(0, i*8); g.lineTo(64, i*8); g.stroke() }
  for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.moveTo(i*21, 0); g.lineTo(i*21, 64); g.stroke() }
})
// 砖块
makeBlockTex('brick', (g) => {
  g.fillStyle = '#a0403c'; g.fillRect(0, 0, 64, 64)
  for (let r = 0; r < 4; r++) {
    const off = r % 2 === 0 ? 0 : 16
    for (let c = 0; c < 3; c++) {
      g.fillStyle = `rgba(${rand(g,30)+120},${rand(g,20)+40},${rand(g,20)+40},0.4)`
      g.fillRect(c * 21 + off, r * 16, 19, 14)
    }
  }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2
  for (let r = 0; r < 4; r++) { const off = r % 2 === 0 ? 0 : 16; for (let c = 0; c < 3; c++) { g.strokeRect(c * 21 + off, r * 16, 19, 14) } }
})
// 玻璃
makeBlockTex('glass', (g) => {
  g.fillStyle = 'rgba(180,220,255,0.5)'; g.fillRect(0, 0, 64, 64)
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60)
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(4, 4, 10, 10); g.fillRect(20, 30, 8, 8)
})

const blockTypes = [
  { key: 'grass', color: '#7c9c4c', name: '草地' },
  { key: 'dirt', color: '#8b6914', name: '泥土' },
  { key: 'stone', color: '#7a7a7a', name: '石头' },
  { key: 'plank', color: '#bc9862', name: '木板' },
  { key: 'brick', color: '#a0403c', name: '砖块' },
  { key: 'glass', color: 'rgba(180,220,255,0.6)', name: '玻璃' },
  { key: 'ball', color: '#ffe16b', name: '光球' },
]
function currentBlockTex() { return blockTextures[blockTypes[selectedSlot.value].key] }

/* ============ 本地世界坐标 ============ */
const ORIGIN = Cesium.Cartesian3.fromDegrees(116.3983, 39.9135)
const ENU = Cesium.Transforms.eastNorthUpToFixedFrame(ORIGIN)
const ENU_INV = Cesium.Matrix4.inverse(ENU, new Cesium.Matrix4())
function toRadLon(x) { return Cesium.Math.toRadians(116.3983 + x / (111320 * Math.cos(Cesium.Math.toRadians(39.9135)))) }
function toRadLat(z) { return Cesium.Math.toRadians(39.9135 + z / 110542) }
function myRect(x0, z0, x1, z1) { return new Cesium.Rectangle(toRadLon(x0), toRadLat(z0), toRadLon(x1), toRadLat(z1)) }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
function wpos(x, y, z) {
  const cosLat = Math.cos(39.9135 * Math.PI / 180)
  return Cesium.Cartesian3.fromDegrees(116.3983 + x / (111320 * cosLat), 39.9135 + z / 110542, y)
}

/* ============ 玩家 ============ */
const player = { x: 0, z: 0, y: 1.1, vy: 0, yaw: 0, camPitch: -0.05, radius: 0.3, height: 1.7 }
let playerBody = null, playerHead = null, playerNose = null
const colliders = []
const placedBoxes = []
const ballObjs = []
const charParts = []

let mouseLastX = 0, mouseLastY = 0
const WORLD = 180
const GRAVITY = -19.6
const WALK = 5.2, SPRINT = 8.4, JUMP_V = 8.8
const BOX_MAX = 300
let jumpLock = false

/* ============ 世界搭建 ============ */
function addGround() {
  viewer.entities.add({
    rectangle: { coordinates: myRect(-150, -150, 150, 150), material: Cesium.Color.fromCssColorString('#5a8a3a'), height: 0.05, shadows: Cesium.ShadowMode.RECEIVE_ONLY },
  })
}
function addBuildings() {
  let seed = 42
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const x = i * 36 + rnd() * 6 - 3
    const z = j * 36 + rnd() * 6 - 3
    if (Math.abs(x) < 45 && Math.abs(z) < 45) continue // 出生点周围留空地
    const h = 8 + rnd() * 35
    const w = 10 + rnd() * 6
    const d = 10 + rnd() * 6
    viewer.entities.add({
      position: wpos(x, h / 2, z),
      box: { dimensions: new Cesium.Cartesian3(w, d, h), material: Cesium.Color.fromCssColorString('#8892a4'), shadows: Cesium.ShadowMode.ENABLED },
    })
    colliders.push({ x, z, w, d, h })
  }
}
function addTrees() {
  let seed = 7
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647 }
  let made = 0
  while (made < 20) {
    const x = rnd() * 280 - 140
    const z = rnd() * 280 - 140
    if (Math.abs(x) < 16 && Math.abs(z) < 16) continue
    if (colliders.some(cb => Math.abs(x - cb.x) < cb.w / 2 + 2 && Math.abs(z - cb.z) < cb.d / 2 + 2)) continue
    const h = 3 + rnd() * 2
    const s = 1.5 + rnd() * 0.8
    viewer.entities.add({ position: wpos(x, h / 2, z), cylinder: { height: h, topRadius: 0.14, bottomRadius: 0.22, material: Cesium.Color.fromCssColorString('#6b4a2f'), shadows: Cesium.ShadowMode.ENABLED } })
    viewer.entities.add({ position: wpos(x, h + s * 0.7, z), ellipsoid: { radii: new Cesium.Cartesian3(s, s, s * 0.8), material: Cesium.Color.fromCssColorString('#3f8f4c'), shadows: Cesium.ShadowMode.ENABLED } })
    colliders.push({ x, z, w: 1.5, d: 1.5, h: 1.5 })
    made++
  }
}

/* ============ 角色 ============ */
function buildCharacter() {
  const skin = Cesium.Color.fromCssColorString('#ffcc99')
  const shirt = Cesium.Color.fromCssColorString('#4488cc')
  const pants = Cesium.Color.fromCssColorString('#333355')
  const shoe = Cesium.Color.fromCssColorString('#222222')
  const hair = Cesium.Color.fromCssColorString('#553322')
  const add = (posFn, geom) => { const e = viewer.entities.add({ position: new Cesium.CallbackProperty(posFn, false), ...geom }); charParts.push(e) }
  const p = () => player
  add(() => wpos(p().x, p().y + 1.1, p().z), { box: { dimensions: new Cesium.Cartesian3(0.4, 0.3, 0.6), material: shirt, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x, p().y + 1.65, p().z), { ellipsoid: { radii: new Cesium.Cartesian3(0.2, 0.2, 0.22), material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x, p().y + 1.78, p().z), { ellipsoid: { radii: new Cesium.Cartesian3(0.2, 0.2, 0.1), material: hair } })
  add(() => wpos(p().x - 0.12, p().y + 0.35, p().z), { cylinder: { length: 0.7, topRadius: 0.08, bottomRadius: 0.1, material: pants, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x + 0.12, p().y + 0.35, p().z), { cylinder: { length: 0.7, topRadius: 0.08, bottomRadius: 0.1, material: pants, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x - 0.28, p().y + 1.2, p().z), { cylinder: { length: 0.6, topRadius: 0.06, bottomRadius: 0.07, material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x + 0.28, p().y + 1.2, p().z), { cylinder: { length: 0.6, topRadius: 0.06, bottomRadius: 0.07, material: skin, shadows: Cesium.ShadowMode.ENABLED } })
  add(() => wpos(p().x - 0.12, p().y + 0.05, p().z), { box: { dimensions: new Cesium.Cartesian3(0.15, 0.1, 0.2), material: shoe } })
  add(() => wpos(p().x + 0.12, p().y + 0.05, p().z), { box: { dimensions: new Cesium.Cartesian3(0.15, 0.1, 0.2), material: shoe } })
  playerBody = charParts[0]; playerHead = charParts[1]; playerNose = charParts[2]
}

/* ============ 地面高度 ============ */
function groundHeight(x, z) {
  let top = 0.05
  for (const b of placedBoxes) {
    if (Math.abs(x - b.x) < 0.6 && Math.abs(z - b.z) < 0.6) top = Math.max(top, b.h + SIZE)
  }
  return top
}

/* ============ 交互 ============ */
function snapGrid(v) { return Math.round(v) }
/* ============ 光球 ============ */
const BALL_MAX = 30
function throwBall() {
  if (ballObjs.length >= BALL_MAX) {
    const old = ballObjs.shift()
    viewer.entities.remove(old.e)
  }
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
  const pitchK = -player.camPitch * 8
  const b = {
    x: player.x + fx * 0.8, y: player.y + 1.5, z: player.z + fz * 0.8,
    vx: fx * 13, vy: 5.5 + pitchK, vz: fz * 13, e: null,
  }
  b.e = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => wpos(b.x, b.y, b.z), false),
    ellipsoid: { radii: new Cesium.Cartesian3(0.22, 0.22, 0.22), material: Cesium.Color.fromCssColorString('#ffe16b'), shadows: Cesium.ShadowMode.DISABLED },
  })
  ballObjs.push(b)
}
function updateBalls(dt) {
  for (const b of ballObjs) {
    b.vy += GRAVITY * dt
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt
    if (b.y < 0.22) { b.y = 0.22; b.vy = Math.abs(b.vy) * 0.55 }
    if (Math.abs(b.x) > WORLD - 2) { b.vx = -b.vx * 0.6; b.x = clamp(b.x, -WORLD + 2, WORLD - 2) }
    if (Math.abs(b.z) > WORLD - 2) { b.vz = -b.vz * 0.6; b.z = clamp(b.z, -WORLD + 2, WORLD - 2) }
  }
}

function placeBlock(x, y, z) {
  if (placedBoxes.length >= BOX_MAX) {
    const old = placedBoxes.shift(); viewer.entities.remove(old.e)
  }
  const tex = currentBlockTex()
  const boxData = { x, z, h: y, e: null }
  const e = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => wpos(boxData.x, boxData.h + SIZE / 2, boxData.z), false),
    box: { dimensions: new Cesium.Cartesian3(SIZE, SIZE, SIZE), material: new Cesium.ImageMaterialProperty({ image: tex }), shadows: Cesium.ShadowMode.ENABLED },
  })
  boxData.e = e; placedBoxes.push(boxData)
  colliders.push({ x, z, w: SIZE, d: SIZE, h: y + SIZE })
}
function destroyBlock() {
  if (!viewer) return
  const rect = viewer.canvas.getBoundingClientRect()
  const cx = mouseLastX - rect.left, cy = mouseLastY - rect.top
  if (cx < 0 || cy < 0 || cx > rect.width || cy > rect.height) return
  const picked = viewer.scene.pickPosition(new Cesium.Cartesian2(cx, cy))
  if (!picked) return
  const local = Cesium.Matrix4.multiplyByPoint(ENU_INV, picked, new Cesium.Cartesian3())
  // ENU_INV 返回 (x=east, y=north, z=up)
  const wx = local.x, wz = local.y, wy = local.z
  let best = null, bestDist = 1.5
  for (let i = placedBoxes.length - 1; i >= 0; i--) {
    const b = placedBoxes[i]
    const dx = wx - b.x, dz = wz - b.z, dy = wy - (b.h + SIZE / 2)
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < bestDist) { bestDist = dist; best = i }
  }
  if (best !== null) {
    const b = placedBoxes[best]
    viewer.entities.remove(b.e)
    placedBoxes.splice(best, 1)
    const ci = colliders.findIndex(c => c.x === b.x && c.z === b.z && c.w === SIZE)
    if (ci >= 0) colliders.splice(ci, 1)
  }
}
function placeAtClick() {
  if (!viewer) return
  if (selectedSlot.value === 6) { throwBall(); return } // 光球格: 右键扔球
  const rect = viewer.canvas.getBoundingClientRect()
  const cx = mouseLastX - rect.left, cy = mouseLastY - rect.top
  const picked = viewer.scene.pickPosition(new Cesium.Cartesian2(cx, cy))
  if (!picked) return
  const local = Cesium.Matrix4.multiplyByPoint(ENU_INV, picked, new Cesium.Cartesian3())
  const gx = snapGrid(local.x), gz = snapGrid(local.y)
  const gy = groundHeight(gx, gz)
  if (Math.abs(gx) > WORLD - 4 || Math.abs(gz) > WORLD - 4) return
  for (const cb of colliders) {
    if (cb.w > SIZE && Math.abs(gx - cb.x) < cb.w / 2 + 0.5 && Math.abs(gz - cb.z) < cb.d / 2 + 0.5) return
  }
  placeBlock(gx, gy, gz)
}

/* ============ 物理 ============ */
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
  if (mlen > 0) { player.x += (mx / mlen) * spd * dt; player.z += (mz / mlen) * spd * dt }
  if (keys.has('Space')) {
    if (!jumpLock && player.y <= groundHeight(player.x, player.z) + 0.05) { player.vy = JUMP_V; jumpLock = true }
  } else jumpLock = false
  player.vy += GRAVITY * dt; player.y += player.vy * dt
  const gy = groundHeight(player.x, player.z)
  if (player.y <= gy) { player.y = gy; if (player.vy < -18) player.vy = -0.6; else player.vy = 0 }
  for (const cb of colliders) {
    const hw = cb.w / 2 + player.radius, hd = cb.d / 2 + player.radius
    if (player.y < cb.h && Math.abs(player.x - cb.x) < hw && Math.abs(player.z - cb.z) < hd) {
      const px = hw - Math.abs(player.x - cb.x), pz = hd - Math.abs(player.z - cb.z)
      if (px < pz) player.x = cb.x + Math.sign(player.x - cb.x) * hw
      else player.z = cb.z + Math.sign(player.z - cb.z) * hd
    }
  }
  player.x = clamp(player.x, -WORLD, WORLD); player.z = clamp(player.z, -WORLD, WORLD)
}

/* ============ 相机 ============ */
function updateCamera() {
  const c = viewer.camera; const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
  if (camMode.value === 'third') {
    c.setView({ destination: wpos(player.x - fx * 10, player.y + 5.5, player.z - fz * 10), orientation: { heading: player.yaw, pitch: -0.41 + player.camPitch * 0.3, roll: 0 } })
  } else {
    c.setView({ destination: wpos(player.x, player.y + 1.62, player.z), orientation: { heading: player.yaw, pitch: player.camPitch, roll: 0 } })
  }
}

/* ============ 主循环 ============ */
function tick() {
  window.__ticks = (window.__ticks || 0) + 1
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTick) / 1000 || 0.016)
  lastTick = now
  updatePlayer(dt); updateBalls(dt); updateCamera()
  frameCount++
  if (!fpsWindow) { fpsWindow = now; lastHudT = now }
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
  }
}

/* ============ 事件 ============ */
const keys = new Set()
const pointerLocked = ref(false)
function onPointerLockChange() {
  pointerLocked.value = !!(viewer && document.pointerLockElement === viewer.canvas)
}
function onPointerLockError() {
  console.warn('[Engine] 指针锁定失败，使用鼠标位置瞄准模式')
}
function onKeyDown(e) {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault()
  keys.add(e.code)
  if (e.code === 'KeyC') toggleCam()
  if (e.code === 'KeyH') toggleUI()
  if (e.code >= 'Digit1' && e.code <= 'Digit7') selectedSlot.value = parseInt(e.code[5]) - 1
}
function onKeyUp(e) { keys.delete(e.code) }
function onMouseMove(e) {
  if (viewer && document.pointerLockElement === viewer.canvas) {
    // 指针锁定:准星(屏幕中心)即瞄准点
    player.yaw = (player.yaw + e.movementX * 0.0042) % (Math.PI * 2)
    player.camPitch = clamp(player.camPitch - e.movementY * 0.0032, -1.5, 0.8)
    const rect = viewer.canvas.getBoundingClientRect()
    mouseLastX = rect.left + rect.width / 2
    mouseLastY = rect.top + rect.height / 2
  } else {
    const dx = e.clientX - mouseLastX, dy = e.clientY - mouseLastY
    mouseLastX = e.clientX; mouseLastY = e.clientY
    player.yaw = (player.yaw + dx * 0.0042) % (Math.PI * 2)
    player.camPitch = clamp(player.camPitch - dy * 0.0032, -1.5, 0.8)
  }
}
function onWheel(e) {
  const N = 7
  if (e.deltaY > 0) selectedSlot.value = (selectedSlot.value + 1) % N
  else selectedSlot.value = (selectedSlot.value + N - 1) % N
}
let lastAct = 0
function oncePerClick() {
  const now = performance.now()
  if (now - lastAct < 250) return false // 防止 click+contextmenu 双触发
  lastAct = now
  return true
}
function onCanvasClick(e) {
  if (!viewer || e.target !== viewer.canvas) return // 只响应画布本身的点击
  e.preventDefault()
  const locked = document.pointerLockElement === viewer.canvas
  if (!locked) {
    try { viewer.canvas.requestPointerLock() } catch(err) {}
    if (selectedSlot.value === 6) { if (oncePerClick()) throwBall(); return }
    if (e.button === 0) { if (oncePerClick()) destroyBlock() }
    else if (e.button === 2) { if (oncePerClick()) placeAtClick() }
    return
  }
  // 锁定中：浏览器可能把右键以 click(button=2) 派发
  if (selectedSlot.value === 6) { if (oncePerClick()) throwBall(); return }
  if (e.button === 2) { if (oncePerClick()) placeAtClick() }
  else if (e.button === 0) { if (oncePerClick()) destroyBlock() }
}
function onCanvasContext(e) {
  if (!viewer || e.target !== viewer.canvas) return
  e.preventDefault()
  if (oncePerClick()) placeAtClick()
}

/* ============ 控制 ============ */
function toggleUI() { showUI.value = !showUI.value; document.body.classList.toggle('ui-hidden', !showUI.value) }
function toggleCam() { setCamMode(camMode.value === 'third' ? 'first' : 'third') }
function setCamMode(m) { camMode.value = m; const show = m !== 'first'; charParts.forEach(cp => { cp.show = show }) }
function resetPlayer() { player.x = 0; player.z = 0; player.y = 2.5; player.vy = 0; player.yaw = -Math.PI / 4 }

/* ============ 初始化 ============ */
onMounted(async () => {
  try {
  await nextTick()
  viewer = new Cesium.Viewer(mountRef.value, {
    animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
    homeButton: false, infoBox: false, sceneModePicker: false,
    navigationHelpButton: false, fullscreenButton: false, selectionIndicator: false,
    imageryProvider: false, baseLayer: false, shouldAnimate: true,
    skyAtmosphere: false, skyBox: false, creditContainer: document.createElement('div'),
  })
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#1a3050')
  viewer.scene.globe.show = false
  const cam3 = viewer.scene.screenSpaceCameraController
  cam3.enableInputs = false; cam3.enableRotate = false; cam3.enableTranslate = false
  cam3.enableZoom = false; cam3.enableTilt = false; cam3.enableLook = false
  viewer.scene.fog.enabled = true; viewer.scene.fog.density = fogDensity.value
  viewer.shadows = shadowOn.value
  viewer.scene.shadowMap.maximumDistance = 300
  viewer.scene.requestRenderMode = false
  try { viewer.scene.msaaSamples = 4 } catch (e2) {}
  try { viewer.camera.frustum.fov = Cesium.Math.toRadians(70) } catch (e3) {} // MC 风格 FOV
  viewer.scene.highDynamicRange = true
  viewer.scene.postProcessStages.tonemapper = Cesium.Tonemapper.PBR_NEUTRAL
  viewer.scene.postProcessStages.bloom.enabled = bloomOn.value
  viewer.scene.postProcessStages.bloom.threshold = 0.9
  viewer.scene.postProcessStages.exposure = exposure.value
  viewer.camera.setView({ destination: wpos(0, 44, 78), orientation: { heading: 0.6, pitch: -0.4, roll: 0 } })
  // 先注册操控事件(就算后续场景出错也能操作)
  window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove); window.addEventListener('wheel', onWheel)
  window.addEventListener('click', onCanvasClick); window.addEventListener('contextmenu', onCanvasContext)
  document.addEventListener('pointerlockchange', onPointerLockChange)
  document.addEventListener('pointerlockerror', onPointerLockError)
  buildCharacter(); addGround(); addBuildings(); addTrees()
  lastTick = performance.now(); lastHudT = performance.now()
  const oldId = window.__intervalId; if (oldId) clearInterval(oldId)
  window.__intervalId = setInterval(tick, 16)
  // 自动昼夜循环
  window.__dayCycle = setInterval(() => { sunHour.value = (sunHour.value + 0.15) % 24; applySun() }, 3000)
  window.__engine = { viewer, player, tickCount: 0 }
  } catch(e) { window.__mountErr = String(e.stack || e.message || e); console.error('[Engine] mount error:', e) }
})

onBeforeUnmount(() => {
  document.body.classList.remove('ui-hidden')
  if (window.__intervalId) clearInterval(window.__intervalId)
  if (window.__dayCycle) clearInterval(window.__dayCycle)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  document.removeEventListener('pointerlockerror', onPointerLockError)
  if (document.pointerLockElement) document.exitPointerLock()
  window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('wheel', onWheel)
  window.removeEventListener('click', onCanvasClick); window.removeEventListener('contextmenu', onCanvasContext)
  if (viewer && viewer.destroy) viewer.destroy(); viewer = null
})

function applySun() {
  if (!viewer) return; const hh = Math.floor(sunHour.value); const mm = Math.round((sunHour.value - hh) * 60)
  const pad = (n) => String(n).padStart(2, '0')
  viewer.clock.currentTime = Cesium.JulianDate.addSeconds(Cesium.JulianDate.fromDate(new Date('2026-06-21T' + pad(hh) + ':' + pad(mm) + ':00Z')), 0, new Cesium.JulianDate())
}
function onSunHour(e) { sunHour.value = parseFloat(e.target.value); applySun() }
function onFog(e) { fogDensity.value = parseFloat(e.target.value); if (viewer) { viewer.scene.fog.enabled = fogDensity.value > 0.0001; viewer.scene.fog.density = fogDensity.value } }
function setShadow(v) { shadowOn.value = v; if (viewer) viewer.shadows = v }
function setBloom(v) {
  bloomOn.value = v
  if (viewer) { viewer.scene.postProcessStages.bloom.enabled = v; viewer.scene.postProcessStages.bloom.threshold = neonOn.value ? 0.4 : 0.9 }
}
function onExposure(e) { exposure.value = parseFloat(e.target.value); if (viewer) viewer.scene.postProcessStages.exposure = exposure.value }
function onTonemapper(e) {
  tonemapper.value = e.target.value
  if (viewer) {
    const m = ({ neutral: Cesium.Tonemapper.PBR_NEUTRAL, aces: Cesium.Tonemapper.ACES, filmic: Cesium.Tonemapper.FILMIC, none: Cesium.Tonemapper.NONE })[e.target.value]
    viewer.scene.postProcessStages.tonemapper = m
  }
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
  } else {
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#1a3050')
    viewer.scene.fog.color = Cesium.Color.WHITE
    viewer.scene.fog.density = fogDensity.value
    viewer.scene.fog.enabled = fogDensity.value > 0.0001
    viewer.scene.postProcessStages.bloom.enabled = bloomOn.value
    viewer.scene.postProcessStages.bloom.threshold = 0.9
    viewer.scene.postProcessStages.exposure = exposure.value
    sunHour.value = 13; applySun()
  }
}
</script>

<style scoped>
.engine-root { position: fixed; inset: 0; overflow: hidden; font-family: 'Segoe UI', 'PingFang SC', sans-serif; color: #e8ecf4; user-select: none; }
.mount { position: absolute; inset: 0; }
.mount canvas { outline: none; }
.crosshair { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px 0 0 -2px; background: rgba(255,255,255,0.9); z-index: 20; pointer-events: none; transition: all 0.15s; }
.crosshair.locked { width: 14px; height: 14px; margin: -7px 0 0 -7px; background: transparent; border: 2px solid rgba(255,255,255,0.95); box-shadow: 0 0 6px rgba(0,0,0,0.6); border-radius: 50%; }

.topbar { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 10px; z-index: 10; }
.fps { font-variant-numeric: tabular-nums; font-size: 13px; color: #bdf0a8; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }

/* 热键栏 */
.hotbar { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; z-index: 10; background: rgba(0,0,0,0.5); padding: 6px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); }
.slot { width: 48px; height: 48px; border-radius: 4px; cursor: pointer; border: 2px solid rgba(255,255,255,0.3); position: relative; image-rendering: pixelated; }
.slot.active { border-color: #fff; transform: scale(1.12); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
.slotNum { position: absolute; top: 1px; left: 3px; font-size: 10px; color: #fff; text-shadow: 0 0 3px #000; font-weight: 700; }

.help { position: absolute; left: 12px; bottom: 12px; display: grid; grid-template-columns: repeat(3, auto); gap: 2px 12px; z-index: 10; font-size: 11px; color: rgba(255,255,255,0.7); background: rgba(10,14,24,0.5); padding: 6px 10px; border-radius: 8px; }
.help b { color: #aad0ff; }

.chip { pointer-events: auto; background: rgba(20,24,38,0.78); border: 1px solid rgba(120,150,255,0.28); color: #d7e4ff; font-size: 12px; padding: 4px 10px; border-radius: 14px; cursor: pointer; }
.chip:hover { background: rgba(50,70,120,0.9); }
.chip.on { background: #3d6bff; border-color: #8fb0ff; color: #fff; }
.ui-toggle { opacity: 0.6; padding: 3px 8px; font-size: 14px; }

.leftbar { position: absolute; top: 54px; left: 12px; display: flex; flex-direction: column; gap: 5px; z-index: 10; }
.console { position: absolute; top: 54px; right: 12px; width: 200px; z-index: 10; max-height: calc(100vh - 90px); overflow-y: auto; background: rgba(12,16,28,0.7); border: 1px solid rgba(120,150,230,0.2); border-radius: 10px; padding: 8px 10px; }
.console::-webkit-scrollbar { width: 4px; }
.console::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
.panel { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 6px 0; }
.panel:last-child { border-bottom: none; }
.ptitle { font-size: 11px; font-weight: 700; color: #ffd9a0; margin-bottom: 6px; }
.ctrl { margin: 5px 0; }
.ctrl .label { display: block; font-size: 10px; color: rgba(255,255,255,0.65); margin-bottom: 2px; }
.ctrl input[type=range] { width: 100%; accent-color: #5a86ff; }
.ctrl select { width: 100%; background: #1b2136; border: 1px solid rgba(255,255,255,0.2); color: #d3e2ff; border-radius: 6px; padding: 3px; font-size: 11px; }
.switch { position: relative; display: inline-block; width: 34px; height: 18px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch .slider { position: absolute; cursor: pointer; inset: 0; background: #2c3248; border-radius: 18px; transition: 0.2s; }
.switch .slider:before { content: ''; position: absolute; width: 12px; height: 12px; left: 3px; top: 3px; background: #8fa3c8; border-radius: 50%; transition: 0.2s; }
.switch input:checked + .slider { background: #3d6bff; }
.switch input:checked + .slider:before { transform: translateX(16px); background: #fff; }
.stat { display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin: 3px 0; color: rgba(255,255,255,0.7); }
.stat b { font-variant-numeric: tabular-nums; color: #b8e6ff; }
</style>