<template>
  <header>
    <nav>
      <router-link to="/">首页</router-link> |
      <router-link to="/blog">博客</router-link> |
      <router-link to="/maps">地图</router-link> |
      <router-link to="/about">关于</router-link>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
header {
  background-color: #333;
  padding: 1rem;
  color: white;
}
nav a {
  color: white;
  text-decoration: none;
  margin: 0 10px;
}
nav a.router-link-active {
  font-weight: bold;
  color: #42b983;
}
</style>
