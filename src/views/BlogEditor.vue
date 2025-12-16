<template>
  <div class="blog-editor">
    <div class="editor-header">
      <h1>{{ isEdit ? '✏️ 编辑博客' : '📝 写新博客' }}</h1>
      <router-link to="/admin" class="btn-back">← 返回管理</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="editor-content">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">标题 *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="输入博客标题..."
            required
          />
        </div>

        <div class="form-group">
          <label for="author">作者 *</label>
          <input
            id="author"
            v-model="form.author"
            type="text"
            placeholder="输入作者名..."
            required
          />
        </div>

        <div class="form-group">
          <label for="coverImage">封面图片URL</label>
          <input
            id="coverImage"
            v-model="form.coverImage"
            type="text"
            placeholder="输入图片URL或留空..."
          />
          <small>例如: /picture/your-image.jpg</small>
        </div>

        <div class="form-group">
          <label for="tags">标签</label>
          <input
            id="tags"
            v-model="tagsInput"
            type="text"
            placeholder="输入标签，用逗号分隔，如: WebGIS, 前端, Vue"
          />
          <small>多个标签用逗号分隔</small>
        </div>

        <div class="form-group">
          <label for="content">
            内容 * 
            <span class="markdown-tip">支持 Markdown 语法</span>
          </label>
          
          <div class="markdown-toolbar">
            <button type="button" @click="insertMarkdown('# ', '')" class="toolbar-btn" title="一级标题">H1</button>
            <button type="button" @click="insertMarkdown('## ', '')" class="toolbar-btn" title="二级标题">H2</button>
            <button type="button" @click="insertMarkdown('### ', '')" class="toolbar-btn" title="三级标题">H3</button>
            <span class="toolbar-divider">|</span>
            <button type="button" @click="insertMarkdown('**', '**')" class="toolbar-btn" title="粗体"><strong>B</strong></button>
            <button type="button" @click="insertMarkdown('*', '*')" class="toolbar-btn" title="斜体"><em>I</em></button>
            <button type="button" @click="insertMarkdown('~~', '~~')" class="toolbar-btn" title="删除线"><s>S</s></button>
            <button type="button" @click="insertMarkdown('<mark>', '</mark>')" class="toolbar-btn" title="高亮">🎨</button>
            <span class="toolbar-divider">|</span>
            <button type="button" @click="insertMarkdown('::: text-left\n', '\n:::')" class="toolbar-btn" title="左对齐">⬅️</button>
            <button type="button" @click="insertMarkdown('::: text-center\n', '\n:::')" class="toolbar-btn" title="居中">↔️</button>
            <button type="button" @click="insertMarkdown('::: text-right\n', '\n:::')" class="toolbar-btn" title="右对齐">➡️</button>
            <button type="button" @click="insertMarkdown('::: text-justify\n', '\n:::')" class="toolbar-btn" title="两端对齐">⬌</button>
            <span class="toolbar-divider">|</span>
            <button type="button" @click="insertMarkdown('- ', '')" class="toolbar-btn" title="无序列表">📋</button>
            <button type="button" @click="insertMarkdown('1. ', '')" class="toolbar-btn" title="有序列表">🔢</button>
            <button type="button" @click="insertMarkdown('\n---\n', '')" class="toolbar-btn" title="分割线">📐</button>
            <button type="button" @click="insertMarkdown('> ', '')" class="toolbar-btn" title="引用">❝</button>
            <button type="button" @click="insertMarkdown('`', '`')" class="toolbar-btn" title="代码">&lt;/&gt;</button>
            <span class="toolbar-divider">|</span>
            <button type="button" @click="insertLink" class="toolbar-btn" title="插入链接">🔗</button>
            <button type="button" @click="showImageDialog = true" class="toolbar-btn toolbar-btn-highlight" title="插入图片">🖼️ 插入图片</button>
          </div>

          <div v-if="showImageDialog" class="image-dialog">
            <div class="dialog-overlay" @click="showImageDialog = false"></div>
            <div class="dialog-content">
              <h3>插入图片</h3>
              <div class="dialog-tabs">
                <button type="button" :class="['tab-btn', {active: imageMode === 'url'}]" @click="imageMode = 'url'">图片URL</button>
                <button type="button" :class="['tab-btn', {active: imageMode === 'upload'}]" @click="imageMode = 'upload'">上传图片</button>
              </div>

              <div v-if="imageMode === 'url'" class="dialog-body">
                <input v-model="imageUrl" type="text" placeholder="输入图片URL，如：/picture/image.jpg" class="dialog-input" />
                <input v-model="imageAlt" type="text" placeholder="图片描述（可选）" class="dialog-input" />
                <div class="dialog-actions">
                  <button type="button" @click="insertImageUrl" class="btn-primary">插入</button>
                  <button type="button" @click="showImageDialog = false" class="btn-secondary">取消</button>
                </div>
              </div>

              <div v-else class="dialog-body">
                <div class="upload-area" @click="$refs.fileInput.click()">
                  <input ref="fileInput" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
                  <div class="upload-placeholder">
                    <span class="upload-icon">📁</span>
                    <p>点击选择图片文件</p>
                    <small>支持 JPG, PNG, GIF 等格式</small>
                  </div>
                </div>
                <div v-if="uploadProgress > 0" class="upload-progress">
                  <div class="progress-bar" :style="{width: uploadProgress + '%'}"></div>
                  <span>{{ uploadProgress }}%</span>
                </div>
                <div class="dialog-actions">
                  <button type="button" @click="showImageDialog = false" class="btn-secondary">关闭</button>
                </div>
              </div>
            </div>
          </div>

          <textarea
            ref="contentTextarea"
            id="content"
            v-model="form.content"
            placeholder="开始写作...

# 一级标题
## 二级标题
### 三级标题

**粗体文本**
*斜体文本*

- 列表项 1
- 列表项 2

> 引用文本

[链接文字](https://example.com)
![图片描述](/picture/image.jpg)"
            required
            rows="20"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? '保存中...' : (isEdit ? '💾 保存修改' : '📤 发布博客') }}
          </button>
          <router-link to="/admin" class="btn-cancel">取消</router-link>
        </div>
      </form>

      <div class="preview-section" v-if="form.content">
        <h3>📄 预览</h3>
        <div class="preview-content" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { blogApi } from '../api/index';
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';

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
  name: 'BlogEditor',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(false);
    const submitting = ref(false);
    const isEdit = computed(() => !!route.params.id);
    const contentTextarea = ref(null);
    const fileInput = ref(null);
    
    const showImageDialog = ref(false);
    const imageMode = ref('url');
    const imageUrl = ref('');
    const imageAlt = ref('');
    const uploadProgress = ref(0);
    
    const form = ref({
      title: '',
      content: '',
      author: '佰世铜',
      coverImage: '',
      tags: []
    });

    const tagsInput = ref('');

    const renderedContent = computed(() => {
      return md.render(form.value.content);
    });

    const fetchBlog = async () => {
      if (!isEdit.value) return;
      
      loading.value = true;
      try {
        const response = await blogApi.getById(route.params.id);
        if (response.success) {
          form.value = {
            title: response.data.title,
            content: response.data.content,
            author: response.data.author,
            coverImage: response.data.coverImage || '',
            tags: response.data.tags || []
          };
          tagsInput.value = form.value.tags.join(', ');
        }
      } catch (err) {
        alert('加载博客失败：' + err.message);
        router.push('/admin');
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      form.value.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      submitting.value = true;
      try {
        if (isEdit.value) {
          await blogApi.update(route.params.id, form.value);
          alert('✅ 博客更新成功！');
        } else {
          await blogApi.create(form.value);
          alert('✅ 博客发布成功！');
        }
        router.push('/admin');
      } catch (err) {
        alert('❌ 操作失败：' + err.message);
        console.error(err);
      } finally {
        submitting.value = false;
      }
    };

    const insertMarkdown = (before, after) => {
      const textarea = contentTextarea.value;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = form.value.content.substring(start, end);
      const newText = form.value.content.substring(0, start) + before + selectedText + after + form.value.content.substring(end);
      
      form.value.content = newText;
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
    };

    // 插入代码函数
    const insertCode = () => {
      const textarea = contentTextarea.value;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = form.value.content.substring(start, end);
      
      if (selectedText) {
        // 有选中文本，直接用反引号包裹
        insertMarkdown('`', '`');
      } else {
        // 没有选中文本，提示用户输入
        const code = prompt('请输入代码内容：');
        if (code) {
          const newText = form.value.content.substring(0, start) + '`' + code + '`' + form.value.content.substring(end);
          form.value.content = newText;
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + code.length + 2, start + code.length + 2);
          }, 0);
        }
      }
    };

    const insertLink = () => {
      const url = prompt('请输入链接地址：', 'https://');
      if (url) {
        const text = prompt('请输入链接文字：', '链接');
        if (text) {
          const markdownLink = `[${text}](${url})`;
          const textarea = contentTextarea.value;
          const start = textarea.selectionStart;
          form.value.content = form.value.content.substring(0, start) + markdownLink + form.value.content.substring(start);
        }
      }
    };

    const insertImageUrl = () => {
      if (!imageUrl.value) {
        alert('请输入图片URL');
        return;
      }
      const alt = imageAlt.value || '图片';
      const markdownImage = `![${alt}](${imageUrl.value})`;
      
      const textarea = contentTextarea.value;
      const start = textarea.selectionStart;
      form.value.content = form.value.content.substring(0, start) + markdownImage + form.value.content.substring(start);
      
      imageUrl.value = '';
      imageAlt.value = '';
      showImageDialog.value = false;
      
      setTimeout(() => textarea.focus(), 0);
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }

      try {
        uploadProgress.value = 0;
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) uploadProgress.value += 10;
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        uploadProgress.value = 100;

        const imagePath = `/picture/${file.name}`;
        const markdownImage = `![${file.name}](${imagePath})`;
        const textarea = contentTextarea.value;
        const start = textarea.selectionStart;
        form.value.content = form.value.content.substring(0, start) + markdownImage + form.value.content.substring(start);
        
        alert(`✅ 图片已插入！\n请将图片 "${file.name}" 复制到 public/picture/ 目录`);
        
        showImageDialog.value = false;
        uploadProgress.value = 0;
        setTimeout(() => textarea.focus(), 0);
      } catch (err) {
        alert('❌ 上传失败：' + err.message);
        uploadProgress.value = 0;
      }
    };

    onMounted(() => {
      fetchBlog();
    });

    return {
      form,
      tagsInput,
      loading,
      submitting,
      isEdit,
      renderedContent,
      handleSubmit,
      contentTextarea,
      fileInput,
      showImageDialog,
      imageMode,
      imageUrl,
      imageAlt,
      uploadProgress,
      insertMarkdown,
      insertLink,
      insertImageUrl,
      handleImageUpload
    };
  }
};
</script>

<style scoped>
.blog-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 3px solid linear-gradient(135deg, #667eea, #764ba2);
}

.editor-header h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.btn-back {
  padding: 10px 24px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 8px;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #667eea;
  color: white;
  transform: translateX(-4px);
}

.loading {
  text-align: center;
  font-size: 1.5rem;
  color: #667eea;
  padding: 100px 0;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

@media (max-width: 1024px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.markdown-tip {
  color: #667eea;
  font-size: 0.85rem;
  font-weight: normal;
  margin-left: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 300px;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.6;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.85rem;
}

.markdown-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
}

.toolbar-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  color: #333;
}

.toolbar-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
}

.toolbar-btn-highlight {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
}

.toolbar-btn-highlight:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
  transform: translateY(-2px) scale(1.05);
}

.toolbar-divider {
  color: #ccc;
  font-weight: bold;
  padding: 0 4px;
}

.image-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 32px;
  min-width: 500px;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.3s ease;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-content h3 {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  color: #333;
}

.dialog-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.dialog-body {
  min-height: 200px;
}

.dialog-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.dialog-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.upload-area {
  border: 3px dashed #ccc;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f0f3ff;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}

.upload-placeholder p {
  margin: 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.upload-placeholder small {
  color: #666;
  font-size: 0.9rem;
}

.upload-progress {
  margin-top: 16px;
  position: relative;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.3s ease;
  border-radius: 15px;
}

.upload-progress span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e0e0e0;
}

.btn-submit {
  flex: 1;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 14px 32px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #999;
}

.preview-section {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.preview-section h3 {
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.preview-content {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 32px;
  line-height: 1.8;
  color: #333;
}

.preview-content h1 {
  font-size: 2rem;
  margin: 24px 0 16px 0;
  color: #222;
}

.preview-content h2 {
  font-size: 1.6rem;
  margin: 20px 0 12px 0;
  color: #333;
}

.preview-content h3 {
  font-size: 1.3rem;
  margin: 16px 0 10px 0;
  color: #444;
}

.preview-content p {
  margin: 12px 0;
}

.preview-content ul,
.preview-content ol {
  padding-left: 24px;
  margin: 12px 0;
}

.preview-content li {
  margin: 6px 0;
}

.preview-content blockquote {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
  font-style: italic;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

.preview-content code {
  background: #90EE90;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  color: #2d5016;
}

.preview-content pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.preview-content pre code {
  background: none;
  color: inherit;
  padding: 0;
}

.preview-content img {
  display: block; /* 让图片独占一行 */
  max-width: 90%; /* 限制最大宽度，留出呼吸感 */
  margin: 20px auto; /* 居中显示 */
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-content a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.preview-content a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 排版样式 */
:deep(.text-left) { text-align: left; }
:deep(.text-center) { text-align: center; }
:deep(.text-right) { text-align: right; }
:deep(.text-justify) { text-align: justify; }
:deep(mark) { background-color: #fff59d; padding: 0 4px; border-radius: 2px; }
</style>
