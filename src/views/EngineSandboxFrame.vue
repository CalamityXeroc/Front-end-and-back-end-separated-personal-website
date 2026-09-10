<template>
  <div class="frame-root">
    <iframe
      class="frame"
      :src="src"
      allow="pointer-lock; fullscreen"
      title="体素沙盒"
    ></iframe>
  </div>
</template>

<script setup>
/**
 * 引擎沙盒(体素沙盒)容器页。
 * 沙盒本体是独立项目 Cesium-Voxel-Sandbox(单独仓库), 此处仅以内嵌方式展示:
 *   本地开发 → http://localhost:3100 (需先启动沙盒项目 dev server)
 *   线上     → /voxel/ (沙盒项目构建产物部署目录)
 */
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname)
const src = isLocal ? 'http://localhost:3100/' : '/voxel/'
</script>

<style scoped>
.frame-root { position: fixed; inset: 0; overflow: hidden; background: #1a3050; }
.frame { width: 100%; height: 100%; border: 0; display: block; }
</style>
