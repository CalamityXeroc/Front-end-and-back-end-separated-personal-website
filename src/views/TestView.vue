<!--
快速测试页面 - 直接显示博客内容，不经过编辑器
放在 src/views/ 目录下，路由可选
-->

<template>
  <div class="test-view">
    <h1>📋 博客内容完整性测试</h1>
    
    <div class="test-box">
      <h2>从编辑器加载的内容长度</h2>
      <input 
        v-model="blogId" 
        type="number" 
        placeholder="输入博客 ID"
        @keyup.enter="loadBlog"
      />
      <button @click="loadBlog">加载</button>
    </div>

    <div v-if="blog" class="result-box">
      <h3>博客信息：</h3>
      <p><strong>标题：</strong> {{ blog.title }}</p>
      <p><strong>内容字符数：</strong> {{ blog.content.length }}</p>
      <p><strong>前 200 字：</strong></p>
      <pre>{{ blog.content.substring(0, 200) }}</pre>
      
      <p><strong>最后 200 字：</strong></p>
      <pre>{{ blog.content.substring(blog.content.length - 200) }}</pre>
      
      <hr />
      
      <h3>Markdown 渲染后的内容：</h3>
      <div class="rendered" v-html="renderedContent"></div>
    </div>

    <div v-else-if="error" class="error">
      ❌ {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { blogApi } from '../api/index';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

export default {
  setup() {
    const blogId = ref(12);
    const blog = ref(null);
    const error = ref(null);

    const renderedContent = computed(() => {
      if (!blog.value) return '';
      return md.render(blog.value.content);
    });

    const loadBlog = async () => {
      try {
        error.value = null;
        const response = await blogApi.getById(blogId.value);
        if (response.success) {
          blog.value = response.data;
        } else {
          error.value = '博客不存在';
        }
      } catch (err) {
        error.value = '加载失败：' + err.message;
      }
    };

    // 初始加载
    loadBlog();

    return {
      blogId,
      blog,
      error,
      renderedContent,
      loadBlog
    };
  }
};
</script>

<style scoped>
.test-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: system-ui;
}

.test-box, .result-box {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.test-box input, .test-box button {
  padding: 8px 12px;
  margin: 5px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.test-box button {
  background: #667eea;
  color: white;
  cursor: pointer;
}

.test-box button:hover {
  background: #764ba2;
}

pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  border: 1px solid #ddd;
}

.rendered {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
  min-height: 200px;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ef5350;
}

hr {
  margin: 30px 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>
