<template>
  <div class="about-wrapper">
    <!-- 背景视频 -->
    <video autoplay loop muted playsinline class="bg-video">
      <source src="/videos/个人介绍背景视频.mp4" type="video/mp4">
      您的浏览器不支持视频标签。
    </video>

    <div class="about-container">
      <div class="profile-header">
      <h1>关于我</h1>
      <p class="tagline">“一名专注于WebGIS可视化开发的探索者，致力于让地图数据讲述更生动的故事。”</p>
      <div class="school-badge">
        🎓 就读于<a href="https://www.buu.edu.cn/" target="_blank">北京联合大学</a>
      </div>
    </div>

    <div class="content-grid">
      <!-- 兴趣与学习 -->
      <section class="card interest-card">
        <h2>🌟 个人兴趣</h2>
        <div class="tags-container">
          <span class="tag">🎮 游戏</span>
          <span class="tag">💎 矿晶</span>
          <span class="tag">🌍 地理</span>
          <span class="tag">🗺️ 制图</span>
          <span class="tag">💻 编程</span>
        </div>
        <div class="learning-status">
          <strong>🚀 正在攻克：</strong>
          <span>前端开发 & 精进制图能力</span>
        </div>
      </section>

      <!-- 核心项目 -->
      <section class="card project-card">
        <h2>💻 核心项目</h2>
        <div class="project-content">
          <div class="project-item">
            <h3>北京绿道系统可视化开放平台</h3>
            <p class="project-desc">初入茅庐GIS开发的第一个作品，欢迎大家来提出宝贵建议！</p>
            <div class="tech-stack">
              <span>Vue3</span>
              <span>Openlayers</span>
              <span>空间数据分析</span>
              <span>响应式设计</span>
            </div>
            <a href="https://github.com/CalamityXeroc/Beijing-Greenway-System-Visualizer-A-openlayer-JS-Implementation.git" target="_blank" class="btn-link">
              查看 GitHub 仓库
            </a>
          </div>
          <div class="project-image">
            <img src="/picture/about-1.png" alt="北京绿道系统截图">
          </div>
        </div>
      </section>

      <!-- 地图故事项目 -->
      <section class="card map-story-card">
        <h2>🗺️ 地图故事：钟鼓叠春秋·轴脉跃千年——荣获易智瑞杯优胜奖</h2>
        <div class="project-content">
          <div class="project-item">
            <h3>北京中轴线遗产价值评估与活化</h3>
            <p class="project-desc">
              本项目以“科学诊断赋能文化永续”为核心，构建“数据-空间-人文”三位一体评估范式。通过AHP-GIS模型与多源数据耦合，精准量化中轴线12处遗产点价值。集成空间诊断引擎与动态策略沙盘，提供可视化的保护规划科学基准，探索历史空间活化与当代城市功能融合的新路径。
            </p>
            <div class="tech-stack">
              <span>AHP-GIS建模</span>
              <span>空间诊断引擎</span>
              <span>动态策略模拟</span>
              <span>数据可视化</span>
            </div>
            <a href="https://www.geosceneonline.cn/geoscene/apps/storymaps/stories/abbe050846ba441181bcfd27ccb0fc21" target="_blank" class="btn-link">
              查看地图故事
            </a>
          </div>
          <div class="project-image">
            <img src="/picture/6-c.png" alt="钟鼓叠春秋·轴脉跃千年" style="object-fit: cover;">
          </div>
        </div>
      </section>

      <!-- 联系方式 -->
      <section class="card contact-card">
        <h2>📬 联系方式</h2>
        <p class="contact-intro">想和我成为朋友？欢迎联系我！</p>
        <div class="contact-content">
          <div class="contact-left">
            <div class="contact-list">
              <div class="contact-item">
                <span class="label">邮箱</span>
                <a href="mailto:2749955791@qq.com">2749955791@qq.com</a>
              </div>
              <div class="contact-item">
                <span class="label">个人群聊</span>
                <a href="https://jq.qq.com/?_wv=1027&k=5v0q6q6" target="_blank">467629377</a>
              </div>
              <div class="contact-item">
                <span class="label">GitHub</span>
                <a href="https://github.com/CalamityXeroc" target="_blank">CalamityXeroc</a>
              </div>
            </div>
            <!-- 组件嵌入 -->
            <div class="widget-embed">
              <iframe
                class="widget-iframe"
                src="https://www.widgets.link/#/fans-bilibili?upFansColor=999999&upNameColor=333333&bg=&p=15&i=02&un=佰世铜&ui=325685845&br=13&_b=true&bs=true&bpc=ffffff"
                title="B站粉丝组件"
                loading="lazy"
                referrerpolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-popups"
              ></iframe>
            </div>
          </div>
          <div class="contact-image">
            <img src="/picture/about-2.gif" alt="欢迎你">
          </div>
        </div>
      </section>
    </div>
  </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style scoped>
/* 视频背景样式 */
.about-wrapper {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 100vw;
}

.bg-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.about-container {
  position: relative; /* 确保内容在视频上方 */
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
}

.profile-header {
  text-align: center;
  margin-bottom: 50px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.tagline {
  font-size: 1.2rem;
  color: #666;
  font-style: italic;
  margin-bottom: 20px;
  line-height: 1.6;
}

.school-badge {
  display: inline-block;
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
}

.school-badge a {
  color: inherit;
  text-decoration: none;
  margin-left: 2px; /* 稍微加一点点间距，不至于太挤 */
}

.school-badge a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.content-grid {
  display: grid;
  gap: 30px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
  color: #2c3e50;
}

/* Tags */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tag {
  background-color: #f0f2f5;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #555;
}

.learning-status {
  background-color: #fff8e1;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

/* Project */
.project-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.project-item {
  flex: 1;
}

.project-item h3 {
  margin-top: 0;
  color: #42b983;
}

.project-desc {
  color: #666;
  margin-bottom: 15px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tech-stack span {
  font-size: 0.85rem;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
}

.project-image {
  flex-shrink: 0;
  width: 300px;
}

.project-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@keyframes dance6123 {
  to {
    background-position: var(--width);
  }
}

.btn-link {
  --width: 180px;
  --timing: 2s;
  display: inline-block;
  width: var(--width);
  padding: 10px 0;
  color: #fff;
  font-weight: bold;
  font-size: 1em;
  background: rgb(64, 192, 87);
  transition: all 0.2s;
  border-radius: 6px;
  text-decoration: none;
  text-align: center;
  border: 0;
  cursor: pointer;
}

.btn-link:hover {
  background-image: linear-gradient(
    to right,
    rgb(250, 82, 82),
    rgb(250, 82, 82) 16.65%,
    rgb(190, 75, 219) 16.65%,
    rgb(190, 75, 219) 33.3%,
    rgb(76, 110, 245) 33.3%,
    rgb(76, 110, 245) 49.95%,
    rgb(64, 192, 87) 49.95%,
    rgb(64, 192, 87) 66.6%,
    rgb(250, 176, 5) 66.6%,
    rgb(250, 176, 5) 83.25%,
    rgb(253, 126, 20) 83.25%,
    rgb(253, 126, 20) 100%,
    rgb(250, 82, 82) 100%
  );
  animation: var(--timing) linear dance6123 infinite;
  transform: scale(1.05) translateY(-1px);
}

/* Contact */
.contact-intro {
  margin-bottom: 20px;
}

.contact-content {
  display: flex;
  gap: 5px;
  align-items: flex-start;
}

.contact-left {
  flex: 1;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.contact-image {
  flex-shrink: 0;
  width: 300px;
  margin-right: 50px;
  margin-top: -40px;
}

.contact-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.contact-item {
  display: flex;
  align-items: center;
  font-size: 1.05rem;
}

.contact-item .label {
  font-weight: bold;
  width: 80px;
  color: #555;
}

.contact-item a {
  color: #42b983;
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

/* 组件嵌入样式 */
.widget-embed {
  display: block;
  margin-top: 10px;
  height: 120px;
  max-width: 320px;
  border-radius: 8px;
  overflow: hidden;
  margin-left: -15px;
}

.widget-embed .widget-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .about-container {
    padding: 40px 16px;
  }
  
  .profile-header h1 {
    font-size: 2rem;
  }
  
  .tagline {
    font-size: 0.95rem;
  }
  
  .school-badge {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
  
  .content-grid {
    gap: 20px;
  }
  
  .card {
    padding: 20px;
  }
  
  .card h2 {
    font-size: 1.4rem;
  }
  
  /* 项目卡片移动端 */
  .project-content {
    flex-direction: column;
  }
  
  .project-item {
    width: 100%;
  }
  
  .project-image {
    width: 100%;
    margin-top: 20px;
  }
  
  /* 联系方式移动端 */
  .contact-content {
    flex-direction: column;
  }
  
  .contact-left,
  .contact-image {
    width: 100%;
  }
  
  .contact-image {
    margin-top: 20px;
  }
  
  .contact-image img {
    max-width: 200px;
    margin: 0 auto;
    display: block;
  }
  
  .widget-embed {
    max-width: 100%;
    margin-left: 0;
    height: 100px;
  }
  
  .tags-container {
    gap: 8px;
  }
  
  .tag {
    font-size: 0.85rem;
    padding: 6px 12px;
  }
  
  .tech-stack span {
    font-size: 0.75rem;
    padding: 4px 10px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .about-container {
    padding: 30px 12px;
  }
  
  .profile-header h1 {
    font-size: 1.6rem;
  }
  
  .tagline {
    font-size: 0.85rem;
  }
  
  .card {
    padding: 16px;
  }
  
  .card h2 {
    font-size: 1.2rem;
  }
  
  .project-item h3 {
    font-size: 1rem;
  }
  
  .project-desc {
    font-size: 0.85rem;
  }
  
  .contact-item {
    font-size: 0.9rem;
  }
  
  .btn-link {
    font-size: 0.85rem;
    padding: 8px 16px;
  }
}
</style>