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
        <div class="loading-spinner"></div>
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
          查看更多博客
          <span class="arrow">→</span>
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
  background-color: transparent; /* 移除背景色 */
  position: absolute; /* 恢复绝对定位 */
  top: 100vh; /* 定位到Hero区域正下方 */
  width: 100%;
  z-index: 20;
  box-shadow: none;
  pointer-events: none; /* 容器不阻挡点击 */
  transform: translateY(0);
  padding-top: 20px; /* 增加顶部间距，让按钮与上方有一段距离 */
}

.nav-item {
  pointer-events: auto; /* 恢复按钮点击 */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 20px;
  padding: 16px 48px;
  text-decoration: none;
  color: #333;
  font-weight: 700;
  font-size: 1.2rem;
  border: none; /* 移除边框 */
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.nav-item:hover {
  background: white;
  color: #667eea;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

/* 博客展示区域 */
.blog-showcase {
  padding: 160px 40px 80px; /* 增加顶部内边距，给悬浮导航留出空间 */
  background: white;
  position: relative;
  z-index: 10;
  background-image: url('/picture/云.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
  /* 移除之前的负边距和圆角 */
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
  background: rgba(255, 255, 255, 0.6); /* 添加半透明白色遮罩，确保文字清晰 */
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

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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

.view-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.view-more-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s;
}

.view-more-btn:hover::before {
  left: 100%;
}

.view-more-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
}

.view-more-btn .arrow {
  font-size: 1.4rem;
  transition: transform 0.3s ease;
}

.view-more-btn:hover .arrow {
  transform: translateX(8px);
}
</style>