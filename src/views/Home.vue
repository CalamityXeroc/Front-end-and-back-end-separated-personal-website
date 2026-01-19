<template>
  <div class="home">
    <main class="hero-section">
      <div class="hero-overlay"></div>
      <div class="content-wrapper">
        <h2 class="typing-effect">道阻且长，行则将至</h2>
        <p class="fade-in-up">欢迎来到佰世铜的个人网站~</p>
        <div class="scroll-indicator" @click="scrollToContent">
          <span>↓</span>
        </div>
      </div>
    </main>
    
    <nav class="home-nav" ref="navRef">
      <router-link to="/blog" class="nav-item">
        <span class="nav-icon">📝</span> 博客
      </router-link>
      <router-link to="/maps" class="nav-item">
        <span class="nav-icon">🗺️</span> 地图
      </router-link>
      <router-link to="/about" class="nav-item">
        <span class="nav-icon">👨‍💻</span> 关于我
      </router-link>
    </nav>

    <!-- 博客展示区域 -->
    <section class="blog-showcase" id="blog-showcase">
      <div class="showcase-header">
        <h2 class="section-title">
          <span class="title-icon">✨</span>
          博客推荐
          <span class="title-icon">✨</span>
        </h2>
        <p class="section-subtitle">分享学习与生活的点点滴滴</p>
        
        <!-- 日期组件：右上角 -->
        <div class="date-widget">
          <iframe
            src="https://www.widgets.link/#/date-number-02?nc=37352F&bbc=ffffff&br=5&bg=&_b=true"
            title="日期组件"
            loading="lazy"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader">
          <div class="cell d-0"></div>
          <div class="cell d-1"></div>
          <div class="cell d-2"></div>
          <div class="cell d-1"></div>
          <div class="cell d-2"></div>
          <div class="cell d-2"></div>
          <div class="cell d-3"></div>
          <div class="cell d-3"></div>
          <div class="cell d-4"></div>
        </div>
        <p>加载中...</p>
      </div>

      <div v-else-if="latestBlogs.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>还没有博客内容</p>
        <router-link to="/blog" class="empty-link">去看看吧</router-link>
      </div>

      <div v-else class="blog-grid">
        <BlogCard 
          v-for="post in latestBlogs" 
          :key="post.id" 
          :post="post" 
          class="blog-card-item"
        />
      </div>

      <div v-if="latestBlogs.length > 0" class="view-more-container">
        <router-link to="/blog" class="view-more-btn">
          <span class="text">查看更多博客 →</span>
          <span class="shimmer"></span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { blogApi } from '../api/index';
import BlogCard from '../components/BlogCard.vue';

export default {
  name: 'Home',
  components: {
    BlogCard
  },
  setup() {
    const latestBlogs = ref([]);
    const loading = ref(true);

    const fetchLatestBlogs = async () => {
      try {
        loading.value = true;
        const response = await blogApi.getAll();
        if (response.success) {
          // 获取最新的6篇博客
          latestBlogs.value = response.data
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        }
      } catch (err) {
        console.error('获取博客失败:', err);
      } finally {
        loading.value = false;
      }
    };

    const scrollToContent = () => {
      const element = document.getElementById('blog-showcase');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    onMounted(() => {
      fetchLatestBlogs();
    });

    return {
      latestBlogs,
      loading,
      scrollToContent
    };
  }
}
</script>

<style scoped>
.home {
  padding: 0;
  margin: 0;
  overflow-x: hidden;
  background: transparent;
  width: 100%;
  max-width: 100vw;
}

.hero-section {
  background-image: url('/picture/主页背景.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed; /* 视差滚动效果 */
  height: 100vh; /* 恢复全屏高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  position: relative;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.content-wrapper {
  position: relative;
  z-index: 2;
  padding: 20px;
}

.typing-effect {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  text-shadow: 0 4px 8px rgba(0,0,0,0.5);
  overflow: hidden;
  white-space: nowrap;
  border-right: 4px solid white;
  animation: typing 2s steps(30, end), blink-caret 0.75s step-end infinite;
  max-width: 100%;
  display: inline-block;
}

@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: white }
}

.fade-in-up {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 2s forwards; /* 延迟2秒等待打字效果完成 */
}

.scroll-indicator {
  position: absolute;
  bottom: -150px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  animation: bounce 1.25s infinite;
  font-size: 2rem;
  color: white;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.scroll-indicator:hover {
  opacity: 1;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-10px); }
  60% { transform: translateX(-50%) translateY(-5px); }
}

.home-nav {
  padding: 0;
  text-align: center;
  background-color: transparent; 
  position: absolute; 
  top: 100vh; 
  width: 100%;
  z-index: 20;
  box-shadow: none;
  pointer-events: none; 
  transform: translateY(0);
  padding-top: 20px; 
}

.nav-item {
  pointer-events: auto;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 20px;
  padding: 16px 48px;
  text-decoration: none;
  color: #fff;
  font-weight: 700;
  font-size: 1.2rem;
  border: none;
  border-radius: 30px;
  background: linear-gradient(90deg, #03a9f4, #f441a5, #ffeb3b, #03a9f4);
  background-size: 300%;
  z-index: 1;
  transition: all 0.3s ease;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  z-index: -1;
  background: linear-gradient(90deg, #03a9f4, #f441a5, #ffeb3b, #03a9f4);
  background-size: 400%;
  border-radius: 35px;
  opacity: 0;
  transition: opacity 1s, filter 1s;
}

.nav-item:hover {
  animation: nav-gradient 8s linear infinite;
}

.nav-item:hover::before {
  opacity: 1;
  filter: blur(20px);
}

.nav-item:active {
  background: linear-gradient(32deg, #03a9f4, #f441a5, #ffeb3b, #03a9f4);
}

@keyframes nav-gradient {
  0% {
    background-position: 0%;
  }
  100% {
    background-position: 400%;
  }
}

/* 博客展示区域 */
.blog-showcase {
  padding: 160px 40px 80px; 
  background: white;
  position: relative;
  z-index: 10;
  background-image: url('/picture/云.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
  margin-top: 0;
  border-radius: 0;
}

.nav-icon {
  font-size: 1.2rem;
}

.blog-showcase::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.6); 
  z-index: 0;
}

.showcase-header {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
}

/* 日期组件样式 */
.date-widget {
  position: absolute;
  top: -85px;
  left: -50px;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;

}

.date-widget iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  font-size: 2rem;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.section-subtitle {
  font-size: 1.2rem;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #667eea;
}

.loader {
  --cell-size: 52px;
  --cell-spacing: 1px;
  --cells: 3;
  --total-size: calc(
    var(--cells) * (var(--cell-size) + 2 * var(--cell-spacing))
  );
  display: flex;
  flex-wrap: wrap;
  width: var(--total-size);
  height: var(--total-size);
  margin: 0 auto 20px;
}

.cell {
  flex: 0 0 var(--cell-size);
  margin: var(--cell-spacing);
  background-color: transparent;
  box-sizing: border-box;
  border-radius: 4px;
  animation: 1.5s ripple ease infinite;
}

.cell.d-1 {
  animation-delay: 100ms;
}

.cell.d-2 {
  animation-delay: 200ms;
}

.cell.d-3 {
  animation-delay: 300ms;
}

.cell.d-4 {
  animation-delay: 400ms;
}

.cell:nth-child(1) {
  --cell-color: #00ff87;
}

.cell:nth-child(2) {
  --cell-color: #0cfd95;
}

.cell:nth-child(3) {
  --cell-color: #17fba2;
}

.cell:nth-child(4) {
  --cell-color: #23f9b2;
}

.cell:nth-child(5) {
  --cell-color: #30f7c3;
}

.cell:nth-child(6) {
  --cell-color: #3df5d4;
}

.cell:nth-child(7) {
  --cell-color: #45f4de;
}

.cell:nth-child(8) {
  --cell-color: #53f1f0;
}

.cell:nth-child(9) {
  --cell-color: #60efff;
}

@keyframes ripple {
  0% {
    background-color: transparent;
  }
  30% {
    background-color: var(--cell-color);
  }
  60% {
    background-color: transparent;
  }
  100% {
    background-color: transparent;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  color: #999;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.empty-link {
  display: inline-block;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.empty-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  /* Hero 区域 */
  .hero-section {
    height: 70vh;
    background-attachment: scroll; /* 移动端禁用视差效果 */
  }
  
  .typing-effect {
    font-size: 1.8rem;
    white-space: normal;
    border-right: none;
    animation: none;
  }
  
  .fade-in-up {
    font-size: 1rem;
    animation: fadeInUp 1s ease-out forwards;
  }
  
  .scroll-indicator {
    bottom: -60px;
    font-size: 1.5rem;
  }
  
  /* 导航按钮 - 调整位置避免遮挡标题 */
  .home-nav {
    padding-top: 10px;
    top: 70vh;
    padding-bottom: 15px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .nav-item {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 6px 8px;
    padding: 10px 20px;
    font-size: 0.95rem;
  }
  
  .nav-icon {
    font-size: 0.95rem;
  }
  
  /* 博客展示区域 - 增加顶部间距避免被按钮遮挡 */
  .blog-showcase {
    padding: 120px 16px 40px;
    background-attachment: scroll;
  }
  
  .showcase-header {
    margin-bottom: 30px;
  }
  
  .section-title {
    font-size: 1.8rem;
    gap: 8px;
  }
  
  .title-icon {
    font-size: 1.5rem;
  }
  
  .section-subtitle {
    font-size: 0.9rem;
  }
  
  /* 日期组件在移动端隐藏 */
  .date-widget {
    display: none;
  }
  
  .blog-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .view-more-btn {
    padding: 12px 32px;
    font-size: 1rem;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .hero-section {
    height: 65vh;
  }
  
  .typing-effect {
    font-size: 1.4rem;
  }
  
  .fade-in-up {
    font-size: 0.85rem;
  }
  
  .home-nav {
    top: 65vh;
    justify-content: center;
  }
  
  .nav-item {
    margin: 5px 4px;
    padding: 8px 16px;
    font-size: 0.85rem;
    flex: 0 0 auto;
  }
  
  .section-title {
    font-size: 1.4rem;
  }
  
  .blog-showcase {
    padding: 100px 12px 30px;
  }
}

.blog-card-item {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.blog-card-item:nth-child(1) { animation-delay: 0.1s; }
.blog-card-item:nth-child(2) { animation-delay: 0.2s; }
.blog-card-item:nth-child(3) { animation-delay: 0.3s; }
.blog-card-item:nth-child(4) { animation-delay: 0.4s; }
.blog-card-item:nth-child(5) { animation-delay: 0.5s; }
.blog-card-item:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.blog-card-item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 50px rgba(102, 126, 234, 0.3);
}

.view-more-container {
  text-align: center;
  margin-top: 60px;
  position: relative;
  z-index: 1;
}

@property --shimmer {
  syntax: '<angle>';
  inherits: false;
  initial-value: 33deg;
}

@keyframes shimmer {
  0% {
    --shimmer: 0deg;
  }
  100% {
    --shimmer: 360deg;
  }
}

@keyframes shine {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  55% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes text {
  0% {
    background-position: 100% center;
  }
  100% {
    background-position: -100% center;
  }
}

.view-more-btn {
  --bg: #1e1e1e;
  --glow-hue: 222deg;
  --shadow-hue: 180deg;
  --spring-easing: linear(
    0,
    0.002,
    0.01 0.9%,
    0.038 1.8%,
    0.156,
    0.312 5.8%,
    0.789 11.1%,
    1.015 14.2%,
    1.096,
    1.157,
    1.199,
    1.224 20.3%,
    1.231,
    1.231,
    1.226,
    1.214 24.6%,
    1.176 26.9%,
    1.057 32.6%,
    1.007 35.5%,
    0.984,
    0.968,
    0.956,
    0.949 42%,
    0.946 44.1%,
    0.95 46.5%,
    0.998 57.2%,
    1.007,
    1.011 63.3%,
    1.012 68.3%,
    0.998 84%,
    1
  );
  --spring-duration: 1.33s;
  display: inline-block;
  text-decoration: none;
  color: var(--bg);
  font-weight: 600;
  font-size: 1.1rem;
  background-image: linear-gradient(
    315deg,
    #ffc4ec -10%,
    #efdbfd 50%,
    #ffedd6 110%
  );
  padding: 0.8em 1.4em;
  position: relative;
  isolation: isolate;
  box-shadow: 0 2px 3px 1px hsl(var(--glow-hue) 50% 20% / 50%), inset 0 -10px 20px -10px hsla(var(--shadow-hue), 10%, 90%, 95%);
  border-radius: 0.66em;
  scale: 1;
  transition: all var(--spring-duration) var(--spring-easing);
}

.view-more-btn:hover:not(:active),
.view-more-btn.active {
  transition-duration: calc(var(--spring-duration) * 0.5);
  scale: 1.2;
  box-shadow: 0 4px 8px -2px hsl(var(--glow-hue) 50% 20% / 50%), inset 0 0 0 transparent;
}

.view-more-btn:active {
  scale: 1.1;
  transition-duration: calc(var(--spring-duration) * 0.5);
}

.view-more-btn .shimmer {
  position: absolute;
  inset: -40px;
  border-radius: inherit;
  mask-image: conic-gradient(
    from var(--shimmer, 0deg),
    transparent 0%,
    transparent 10%,
    black 36%,
    black 45%,
    transparent 50%,
    transparent 60%,
    black 85%,
    black 95%,
    transparent 100%
  );
  mask-size: cover;
  mix-blend-mode: plus-lighter;
  animation: shimmer 1s linear infinite both;
}

.view-more-btn:hover .shimmer::before,
.view-more-btn:hover .shimmer::after,
.view-more-btn.active .shimmer::before,
.view-more-btn.active .shimmer::after {
  opacity: 1;
  animation: shine 1.2s ease-in 1 forwards;
}

.view-more-btn .shimmer::before,
.view-more-btn .shimmer::after {
  transition: all 0.5s ease;
  opacity: 0;
  content: '';
  border-radius: inherit;
  position: absolute;
  mix-blend-mode: color;
  inset: 40px;
  pointer-events: none;
}

.view-more-btn .shimmer::before {
  box-shadow: 0 0 3px 2px hsl(var(--glow-hue) 20% 95%), 0 0 7px 4px hsl(var(--glow-hue) 20% 80%), 0 0 13px 4px hsl(var(--glow-hue) 50% 70%), 0 0 25px 5px hsl(var(--glow-hue) 100% 70%);
  z-index: -1;
}

.view-more-btn .shimmer::after {
  box-shadow: inset 0 0 0 1px hsl(var(--glow-hue) 70% 95%), inset 0 0 2px 1px hsl(var(--glow-hue) 100% 80%), inset 0 0 5px 2px hsl(var(--glow-hue) 100% 70%);
  z-index: 2;
}

.view-more-btn .text {
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  background-color: var(--bg);
  background-image: linear-gradient(
    120deg,
    transparent,
    hsla(var(--glow-hue), 100%, 80%, 0.66) 40%,
    hsla(var(--glow-hue), 100%, 90%, 0.9) 50%,
    transparent 52%
  );
  background-repeat: no-repeat;
  background-size: 300% 300%;
  background-position: center 200%;
}

.view-more-btn:hover .text,
.view-more-btn.active .text {
  animation: text 0.66s ease-in 1 both;
}
</style>