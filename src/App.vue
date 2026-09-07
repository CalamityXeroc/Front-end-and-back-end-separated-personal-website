<template>
  <div id="app">
    <Header v-if="$route.path !== '/' && !isImmersive" />
    <nav class="floating-map-nav" :class="{ 'fmn-page': $route.path === '/maps' }" v-if="showMapNav">
      <router-link to="/maps" class="fmn-item" :class="{ 'fmn-on': $route.path === '/maps' }">🗺️ 地图编辑器</router-link>
      <router-link to="/cesium" class="fmn-item" :class="{ 'fmn-on': $route.path === '/cesium' }">🌐 三维沙盘</router-link>
      <router-link to="/sandbox" class="fmn-item" :class="{ 'fmn-on': $route.path === '/sandbox' }">🎮 引擎沙盒</router-link>
    </nav>
    <router-view />
    <footer class="site-footer" v-if="!showMapNav">
      <p>© 2025-2026 佰世铜</p>
      <p><a href="https://beian.miit.gov.cn/">京ICP备2025153719号-1</a></p>
      <p class="beian-police">
        <img src="/picture/备案图标.png" alt="公安备案" class="beian-icon">
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=11022902000506" rel="noreferrer" target="_blank">京公网安备11022902000506号</a>
      </p>
    </footer>
  </div>
</template>

<script>
import Header from './components/Header.vue';

export default {
  components: {
    Header
  },
  computed: {
    showMapNav() {
      return ['/maps', '/cesium', '/sandbox'].includes(this.$route.path)
    },
    isImmersive() {
      return ['/cesium', '/sandbox'].includes(this.$route.path)
    }
  }
}
</script>

<style>
@import './assets/styles/main.css';
@import './assets/styles/migration-guide.css';

#app {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.site-footer {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--spacing-2xl);
  margin-top: 0;
  font-size: 0.9rem;
  width: 100%;
  border-top: 1px solid var(--color-border);
}

.site-footer p {
  margin: var(--spacing-xs) 0;
}

.site-footer a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-base);
}

.site-footer a:hover {
  color: var(--color-primary-light);
  text-decoration: underline;
}

.beian-police {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.beian-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  opacity: 0.7;
}
</style>
<style>
/* 浮动地图切换模块(地图编辑器/三维沙盘/引擎沙盒) */
.floating-map-nav {
  position: fixed;
  z-index: 99999;
  top: 12px;
  left: 12px;
  flex-wrap: wrap;
  display: flex;
  gap: 6px;
  padding: 5px;
  background: rgba(10, 16, 28, 0.78);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}
.fmn-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9px;
  color: rgba(255, 255, 255, 0.62);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}
.fmn-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
.floating-map-nav.fmn-page {
  top: 86px;
  left: 24px;
}
.fmn-item.fmn-on {
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #6a5cff);
  box-shadow: 0 2px 12px rgba(79, 124, 255, 0.5);
}
/* 沙盒隐藏 UI 时,连同本模块与站点头部一起隐藏 */
body.ui-hidden .floating-map-nav,
body.ui-hidden .header {
  display: none !important;
}
</style>
