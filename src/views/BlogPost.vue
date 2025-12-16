<template>
  <div class="blog-post">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="post" class="post-content">
      <img v-if="post.coverImage" :src="post.coverImage" alt="封面" class="cover-image" />
      <h1>{{ post.title }}</h1>
      <div class="meta">
        <span class="author">作者: {{ post.author }}</span>
        <span class="date">{{ formatDate(post.createdAt) }}</span>
        <span class="views">浏览量：{{ post.views }} 次浏览</span>
      </div>
      <div class="tags" v-if="post.tags && post.tags.length">
        <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <div class="content" v-html="renderedContent"></div>
      
      <!-- 留言区 -->
      <CommentSection :blogId="post.id" />
      
      <router-link to="/blog" class="back-link">← 返回博客列表</router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { blogApi } from '../api/index';
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import CommentSection from '../components/CommentSection.vue';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true // 允许回车换行
});

// 注册自定义容器
['text-left', 'text-center', 'text-right', 'text-justify'].forEach(name => {
  md.use(markdownItContainer, name, {
    validate: params => params.trim() === name,
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        return `<div class="${name}">\n`;
      } else {
        return '</div>\n';
      }
    }
  });
});

export default {
  components: {
    CommentSection
  },
  setup() {
    const route = useRoute();
    const post = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const renderedContent = computed(() => {
      if (!post.value || !post.value.content) return '';
      return md.render(post.value.content);
    });

    const fetchPost = async () => {
      try {
        const response = await blogApi.getById(route.params.id);
        if (response.success) {
          post.value = response.data;
        }
      } catch (err) {
        error.value = '加载博客失败';
        console.error('获取博客详情失败:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    onMounted(() => {
      fetchPost();
    });

    return {
      post,
      loading,
      error,
      renderedContent,
      formatDate
    };
  }
};
</script>

<style scoped>
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
}

.error {
  color: #e74c3c;
}

.post-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 20px;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 15px;
  color: #2c3e50;
}

.meta {
  display: flex;
  gap: 20px;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 25px;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 0.85em;
}

.content {
  line-height: 1.8;
  font-size: 1.05em;
  color: #34495e;
  margin: 30px 0;
}

.content :deep(h1),
.content :deep(h2),
.content :deep(h3),
.content :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #2c3e50;
}

.content :deep(p) {
  margin-bottom: 1em;
}

.content :deep(code) {
  background: #EBF4ED;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: #2d5016;
}

.content :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
}

.content :deep(pre code) {
  background: none;
  padding: 0;
}

.content :deep(img) {
  display: block;
  max-width: 90%;
  margin: 20px auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content :deep(a) {
  color: #42b983;
  text-decoration: none;
}

.content :deep(a:hover) {
  text-decoration: underline;
}

.content :deep(blockquote) {
  border-left: 4px solid #42b983;
  padding-left: 16px;
  margin: 1.5em 0;
  color: #7f8c8d;
  font-style: italic;
}

.content :deep(ul),
.content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.content :deep(li) {
  margin-bottom: 0.5em;
}

.content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

.content :deep(table th),
.content :deep(table td) {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.content :deep(table th) {
  background: #d4f4d4;
  font-weight: 600;
}

.back-link {
  display: inline-block;
  margin-top: 30px;
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

.back-link:hover {
  text-decoration: underline;
}

/* 排版样式 */
:deep(.text-left) { text-align: left; }
:deep(.text-center) { text-align: center; }
:deep(.text-right) { text-align: right; }
:deep(.text-justify) { text-align: justify; }
:deep(mark) { background-color: #fff59d; padding: 0 4px; border-radius: 2px; }
</style>