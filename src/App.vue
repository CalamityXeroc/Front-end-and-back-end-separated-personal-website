<template>
  <div id="app">
    <Header v-if="$route.path !== '/'" />
    <router-view />
    <footer class="site-footer">
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
  }
}
</script>

<style>
@import './assets/styles/main.css';
@import './assets/styles/migration-guide.css';

#app {
  width: 100%;
  max-width: 100vw;
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