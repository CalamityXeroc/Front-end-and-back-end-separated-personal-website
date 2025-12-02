<template>
  <div id="app">
    <Header v-if="$route.path !== '/'" />
    <router-view />
    <footer class="site-footer">
      <p>© 2025 佰世铜</p>
      <p><a href="https://beian.miit.gov.cn/">京ICP备2025153719号-1</a></p>
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

.site-footer {
  background-color: #333;
  color: #ecf0f1;
  text-align: center;
  padding: 20px;
  margin-top: 0;
  font-size: 0.9rem;
}

.site-footer p {
  margin: 5px 0;
}

.site-footer a {
  color: #ecf0f1;
  text-decoration: none;
}

.site-footer a:hover {
  opacity: 0.8;
}
</style>