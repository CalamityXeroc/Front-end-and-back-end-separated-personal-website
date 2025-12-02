<template>
  <div class="blog-card">
    <img v-if="post.coverImage" :src="post.coverImage" alt="封面" class="cover-image" />
    <h2 class="blog-title">{{ post.title }}</h2>
    <p class="blog-excerpt">{{ getExcerpt(post.content) }}</p>
    <div class="blog-meta">
      <span class="author">{{ post.author }}</span>
      <span class="date">{{ formatDate(post.createdAt) }}</span>
      <span class="views">浏览量：{{ post.views }}</span>
    </div>
    <div class="tags" v-if="post.tags && post.tags.length">
      <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <router-link :to="`/blog/${post.id}`" class="read-more">阅读全文 →</router-link>
  </div>
</template>

<script>
export default {
  name: 'BlogCard',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  methods: {
    getExcerpt(content) {
      // 提取前100个字符作为摘要
      return content ? content.substring(0, 100) + '...' : '';
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }
  }
}
</script>

<style scoped>
.blog-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.blog-title {
  font-size: 1.5em;
  margin: 0;
  color: #2c3e50;
}

.blog-excerpt {
  font-size: 0.95em;
  color: #666;
  line-height: 1.6;
}

.blog-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85em;
  color: #999;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8em;
}

.read-more {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
  align-self: flex-start;
}

.read-more:hover {
  text-decoration: underline;
}
</style>