<template>
  <div class="blog-editor">
    <div class="editor-header">
      <h1>{{ isEdit ? '✏️ 编辑博客' : '📝 写新博客' }}</h1>
      <router-link to="/admin" class="btn-back">← 返回管理</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="editor-content">
      <form @submit.prevent="handleSubmit" class="editor-form">
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
          <div class="tags-capsule-container">
            <span
              v-for="tag in availableTags"
              :key="tag"
              :class="['tag-capsule', { selected: form.tags.includes(tag) }]"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
          <input
            id="tags"
            v-model="newTagInput"
            type="text"
            placeholder="添加新标签..."
            @keypress.enter.prevent="addNewTag"
          />
          <small>点击选择标签或按 Enter 添加新标签</small>
        </div>

        <div class="form-group">
          <label for="content">
            内容 * 
            <span class="markdown-tip">💡 支持拖拽或粘贴图片上传 | Markdown 语法</span>
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
            <button type="button" @click="insertCode" class="toolbar-btn toolbar-btn-code" title="插入代码">💻 代码</button>
            <span class="toolbar-divider">|</span>
            <button type="button" @click="showTableDialog = true" class="toolbar-btn toolbar-btn-highlight" title="插入表格">📊 表格</button>
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

          <!-- 表格插入对话框 -->
          <div v-if="showTableDialog" class="table-dialog">
            <div class="dialog-overlay" @click="showTableDialog = false"></div>
            <div class="dialog-content table-dialog-content">
              <h3>📊 插入表格</h3>
              <div class="dialog-tabs">
                <button type="button" :class="['tab-btn', {active: tableMode === 'manual'}]" @click="tableMode = 'manual'">手动创建</button>
                <button type="button" :class="['tab-btn', {active: tableMode === 'import'}]" @click="tableMode = 'import'">导入数据</button>
              </div>

              <div v-if="tableMode === 'manual'" class="dialog-body">
                <div class="form-row">
                  <label>行数：</label>
                  <input v-model.number="tableRows" type="number" min="1" max="50" class="dialog-input" />
                </div>
                <div class="form-row">
                  <label>列数：</label>
                  <input v-model.number="tableCols" type="number" min="1" max="10" class="dialog-input" />
                </div>
                <div class="dialog-actions">
                  <button type="button" @click="insertBlankTable" class="btn-primary">创建表格</button>
                  <button type="button" @click="showTableDialog = false" class="btn-secondary">取消</button>
                </div>
              </div>

              <div v-else class="dialog-body">
                <p class="import-tip">💡 提示：粘贴表格数据，支持Tab分隔或回车换行（每行为表格行）</p>
                <textarea 
                  v-model="tableDataInput"
                  class="table-textarea"
                  placeholder="方法	说明
getFullYear()	获取年份，取值为4位数字
getMonth()	获取月份，取值为0到11
getDate()	获取日数，取值为1~31"
                  rows="8"
                ></textarea>
                <div class="import-options">
                  <label>
                    <input v-model="tableHasHeader" type="checkbox" />
                    第一行作为表头
                  </label>
                </div>
                <div class="dialog-actions">
                  <button type="button" @click="insertTableFromData" class="btn-primary">导入表格</button>
                  <button type="button" @click="showTableDialog = false" class="btn-secondary">取消</button>
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
    </div>

    <!-- 预览区单独放在下方，不受其他约束 -->
    <div v-if="form.content" class="preview-section-standalone">
      <h3>📄 实时预览</h3>
      <div class="preview-content" ref="previewRef"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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
    const previewRef = ref(null);
    
    const showImageDialog = ref(false);
    const imageMode = ref('url');
    const imageUrl = ref('');
    const imageAlt = ref('');
    const uploadProgress = ref(0);
    const showPreviewSource = ref(false);
    
    // 表格相关状态
    const showTableDialog = ref(false);
    const tableMode = ref('manual');
    const tableRows = ref(3);
    const tableCols = ref(3);
    const tableDataInput = ref('');
    const tableHasHeader = ref(true);
    
    const form = ref({
      title: '',
      content: '',
      author: '佰世铜',
      coverImage: '',
      tags: []
    });

    const tagsInput = ref('');
    const newTagInput = ref('');
    const availableTags = ref(['WebGIS', '前端', 'Vue', 'JavaScript', 'Python', 'Node.js', '数据库', '算法']);
    const isUploading = ref(false);

    const toggleTag = (tag) => {
      const index = form.value.tags.indexOf(tag);
      if (index > -1) {
        form.value.tags.splice(index, 1);
      } else {
        form.value.tags.push(tag);
      }
    };

    const addNewTag = () => {
      const newTag = newTagInput.value.trim();
      if (newTag && !availableTags.value.includes(newTag)) {
        availableTags.value.push(newTag);
        form.value.tags.push(newTag);
        newTagInput.value = '';
      } else if (newTag && !form.value.tags.includes(newTag)) {
        form.value.tags.push(newTag);
        newTagInput.value = '';
      }
    };

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
          // 更新可用标签列表
          response.data.tags?.forEach(tag => {
            if (!availableTags.value.includes(tag)) {
              availableTags.value.push(tag);
            }
          });
        }
      } catch (err) {
        alert('加载博客失败：' + err.message);
        router.push('/admin');
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
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

    // 插入代码块功能 - 重构版
    const insertCode = () => {
      const textarea = contentTextarea.value;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      let selectedText = form.value.content.substring(start, end);
      
      // 移除公共缩进
      const removeCommonIndent = (text) => {
        const lines = text.split('\n');
        if (lines.length <= 1) return text;
        
        let minIndent = Infinity;
        for (const line of lines) {
          if (line.trim().length > 0) {
            const indent = line.match(/^\s*/)[0].length;
            minIndent = Math.min(minIndent, indent);
          }
        }
        
        if (minIndent > 0 && minIndent !== Infinity) {
          return lines.map(line => line.substring(minIndent)).join('\n');
        }
        return text;
      };
      
      if (selectedText) {
        // 有选中文本
        if (selectedText.includes('\n')) {
          // 多行代码 - 使用代码块
          selectedText = removeCommonIndent(selectedText);
          
          // 弹出对话框选择语言
          const language = prompt('请输入代码语言（可选，如：javascript, python, css）：', '');
          const langTag = language ? language.trim() : '';
          
          const codeBlock = `\`\`\`${langTag}\n${selectedText}\n\`\`\``;
          const newText = form.value.content.substring(0, start) + codeBlock + form.value.content.substring(end);
          form.value.content = newText;
          
          setTimeout(() => {
            textarea.focus();
            // 光标定位到代码块结束后
            const newPos = start + codeBlock.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        } else {
          // 单行代码 - 使用行内代码
          insertMarkdown('`', '`');
        }
      } else {
        // 没有选中文本 - 显示选项菜单
        const choice = prompt('请选择代码类型：\n1 - 行内代码\n2 - 代码块\n\n输入数字选择：', '2');
        
        if (choice === '1') {
          // 行内代码
          const code = prompt('请输入行内代码：');
          if (code) {
            const inlineCode = `\`${code}\``;
            const newText = form.value.content.substring(0, start) + inlineCode + form.value.content.substring(end);
            form.value.content = newText;
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + inlineCode.length, start + inlineCode.length);
            }, 0);
          }
        } else if (choice === '2') {
          // 代码块
          const language = prompt('请输入代码语言（可选，如：javascript, python, css）：', 'javascript');
          const langTag = language ? language.trim() : '';
          
          // 插入代码块模板
          const template = `\`\`\`${langTag}\n// 在此输入代码\n\`\`\``;
          const newText = form.value.content.substring(0, start) + template + form.value.content.substring(end);
          form.value.content = newText;
          
          setTimeout(() => {
            textarea.focus();
            // 光标定位到代码块内部
            const cursorPos = start + langTag.length + 4; // ``` + 语言 + \n
            textarea.setSelectionRange(cursorPos, cursorPos + 10); // 选中 "// 在此输入代码"
          }, 50);
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

    const addCopyButtons = () => {
      const preElements = document.querySelectorAll('.preview-content pre');
      preElements.forEach(pre => {
        // 避免重复添加按钮
        if (pre.querySelector('.copy-btn')) return;
        
        // 创建复制按钮
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerHTML = '📋 复制';
        button.title = '复制代码';
        
        // 将 pre 设置为相对定位
        pre.style.position = 'relative';
        pre.appendChild(button);
        
        // 添加点击事件
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          const codeElement = pre.querySelector('code') || pre;
          const codeToCopy = codeElement.textContent || '';
          
          // 优先使用现代、安全的Clipboard API
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codeToCopy).then(() => {
              button.innerHTML = '✅ 已复制!';
              button.classList.add('copied');
              setTimeout(() => {
                button.innerHTML = '📋 复制';
                button.classList.remove('copied');
              }, 2000);
            }).catch((err) => {
              console.error('无法复制代码:', err);
              button.textContent = '复制失败';
              setTimeout(() => {
                button.innerHTML = '📋 复制';
              }, 2000);
            });
          } else {
            // 备用方法
            fallbackCopyText(codeToCopy, button);
          }
        });
      });
    };
    
    const fallbackCopyText = (text, button) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          button.innerHTML = '✅ 已复制!';
          button.classList.add('copied');
          setTimeout(() => {
            button.innerHTML = '📋 复制';
            button.classList.remove('copied');
          }, 2000);
        } else {
          button.textContent = '复制失败';
          setTimeout(() => {
            button.innerHTML = '📋 复制';
          }, 2000);
        }
      } catch (err) {
        console.error('备用复制失败:', err);
        button.textContent = '复制失败';
        setTimeout(() => {
          button.innerHTML = '📋 复制';
        }, 2000);
      }
      
      document.body.removeChild(textArea);
    };

    // 图片粘贴和拖拽上传功能
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          e.stopPropagation();
          const blob = items[i].getAsFile();
          uploadImageFile(blob);
          return;
        }
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image') !== -1) {
          uploadImageFile(files[i]);
          return;
        }
      }
    };

    const uploadImageFile = async (file) => {
      if (isUploading.value) {
        alert('已有图片正在上传，请稍候...');
        return;
      }

      isUploading.value = true;
      showUploadIndicator();

      try {
        // 模拟上传 - 这里你需要根据实际的上传API修改
        const formData = new FormData();
        formData.append('image', file, file.name || 'image.png');

        // 模拟上传进度
        uploadProgress.value = 30;
        await new Promise(resolve => setTimeout(resolve, 500));
        uploadProgress.value = 60;
        await new Promise(resolve => setTimeout(resolve, 500));
        uploadProgress.value = 100;

        // 这里应该调用真实的上传API
        // const response = await fetch('/api/upload', { method: 'POST', body: formData });
        // const data = await response.json();

        // 模拟上传成功
        const imageUrl = `/picture/${file.name}`;
        const imageMarkdown = `![${file.name}](${imageUrl})\n`;
        insertAtCursor(imageMarkdown);
        
        alert('✅ 图片上传成功！');
      } catch (error) {
        console.error('Upload error:', error);
        alert('❌ 图片上传失败，请重试');
      } finally {
        isUploading.value = false;
        uploadProgress.value = 0;
        hideUploadIndicator();
      }
    };

    const insertAtCursor = (text) => {
      const textarea = contentTextarea.value;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = form.value.content;
      
      form.value.content = content.substring(0, start) + text + content.substring(end);
      
      setTimeout(() => {
        textarea.focus();
        const newPos = start + text.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    };

    const showUploadIndicator = () => {
      let indicator = document.getElementById('upload-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'upload-indicator';
        indicator.className = 'upload-indicator';
        indicator.innerHTML = '📤 正在上传图片...';
        document.body.appendChild(indicator);
      }
    };

    const hideUploadIndicator = () => {
      const indicator = document.getElementById('upload-indicator');
      if (indicator) {
        indicator.remove();
      }
    };

    onMounted(() => {
      fetchBlog();
      
      // 添加粘贴事件监听
      document.addEventListener('paste', handlePaste, true);
      
      // 添加拖拽事件监听
      const textarea = contentTextarea.value;
      if (textarea) {
        textarea.addEventListener('dragover', handleDragOver);
        textarea.addEventListener('dragleave', handleDragLeave);
        textarea.addEventListener('drop', handleDrop);
      }
    });

    // 监听内容变化，直接操作 DOM 更新预览
    watch(
      () => form.value.content,
      async (newContent) => {
        // v-if="form.content" controls the visibility, so we must wait for nextTick
        if (newContent) {
          await nextTick();
          if (previewRef.value) {
            try {
              let html = md.render(newContent);
              // 关键修复：转义非代码块中的 <script> 标签，防止预览区域被截断
              html = html.replace(/<script\b/gi, '&lt;script').replace(/<\/script>/gi, '&lt;/script&gt;');
              
              previewRef.value.innerHTML = html;
              // Add copy buttons logic if needed, or simple buttons
            } catch (err) {
              console.error('Markdown 渲染错误:', err);
              previewRef.value.innerHTML = '<p style="color:red">渲染错误</p>';
            }
          }
        }
      },
      { immediate: true }
    );

    // 表格功能
    const insertBlankTable = () => {
      const rows = Math.max(1, tableRows.value);
      const cols = Math.max(1, tableCols.value);
      
      let table = '';
      
      // 表头行
      table += '| ' + Array(cols).fill('列').map((_, i) => `列${i + 1}`).join(' | ') + ' |\n';
      table += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
      
      // 数据行
      for (let i = 0; i < rows - 1; i++) {
        table += '| ' + Array(cols).fill('').join(' | ') + ' |\n';
      }
      
      const textarea = contentTextarea.value;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      form.value.content = form.value.content.substring(0, start) + '\n' + table + '\n' + form.value.content.substring(start);
      
      showTableDialog.value = false;
      tableRows.value = 3;
      tableCols.value = 3;
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + table.length + 2, start + table.length + 2);
      }, 0);
    };

    const insertTableFromData = () => {
      const data = tableDataInput.value.trim();
      if (!data) {
        alert('请输入表格数据');
        return;
      }

      // 按回车换行分割行
      const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) {
        alert('请输入有效的表格数据');
        return;
      }

      // 解析每一行，支持Tab或多个空格分隔
      const parseRow = (line) => {
        // 首先尝试Tab分隔
        if (line.includes('\t')) {
          return line.split('\t').map(cell => cell.trim());
        }
        // 如果没有Tab，则按连续的空格（至少2个）分隔
        return line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell.length > 0);
      };

      const rows = lines.map(parseRow);
      
      if (rows.length === 0) {
        alert('无法解析表格数据');
        return;
      }

      // 确定最大列数
      const maxCols = Math.max(...rows.map(row => row.length));
      
      // 生成Markdown表格
      let table = '';
      
      rows.forEach((row, idx) => {
        // 补齐空列
        while (row.length < maxCols) {
          row.push('');
        }
        
        table += '| ' + row.join(' | ') + ' |\n';
        
        // 第一行后添加分隔符（如果指定为表头）
        if (idx === 0 && tableHasHeader.value) {
          table += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
        }
      });

      const textarea = contentTextarea.value;
      if (!textarea) return;

      const start = textarea.selectionStart;
      form.value.content = form.value.content.substring(0, start) + '\n' + table + '\n' + form.value.content.substring(start);
      
      showTableDialog.value = false;
      tableDataInput.value = '';
      tableHasHeader.value = true;
      tableMode.value = 'manual';

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + table.length + 2, start + table.length + 2);
      }, 0);
    };

    return {
      form,
      tagsInput,
      newTagInput,
      availableTags,
      loading,
      submitting,
      isEdit,
      renderedContent,
      handleSubmit,
      contentTextarea,
      fileInput,
      previewRef,
      showImageDialog,
      imageMode,
      imageUrl,
      imageAlt,
      uploadProgress,
      insertMarkdown,
      insertCode,
      insertLink,
      insertImageUrl,
      handleImageUpload,
      toggleTag,
      addNewTag,
      showPreviewSource,
      showTableDialog,
      tableMode,
      tableRows,
      tableCols,
      tableDataInput,
      tableHasHeader,
      insertBlankTable,
      insertTableFromData
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
  display: block !important;
  width: 100%;
  max-width: none;
}

.editor-form {
  width: 100% !important;
  max-width: 800px !important;
  margin: 0 auto !important;
  padding: 0 !important;
}

@media (max-width: 1024px) {
  .editor-content {
    display: block;
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
  position: relative;
}

.form-group textarea.drag-over {
  border: 2px dashed #007cba !important;
  background-color: rgba(0, 124, 186, 0.1) !important;
  transition: all 0.3s ease;
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

.toolbar-btn-code {
  background: #2d2d2d;
  color: #90EE90;
  border: 1px solid #2d2d2d;
  font-weight: 600;
}

.toolbar-btn-code:hover {
  background: #1a1a1a;
  color: #90EE90;
  border-color: #90EE90;
  transform: translateY(-2px);
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
  position: relative;
  top: 0;
  max-height: none;
  overflow-y: visible;
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.preview-section-standalone {
  width: 100%;
  max-width: 900px;
  margin: 60px auto 0;
  padding: 30px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
}

.preview-section-standalone h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.preview-content {
  width: 100%;
  background: #fafafa;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  line-height: 1.8;
  color: #333;
}

/* 预览内容样式 */
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

.preview-content code {
  background: #90EE90;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  color: #2d5016;
}

.preview-content pre {
  background: #90EE90;
  color: #2d5016;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  position: relative;
}

.preview-content pre code {
  background: none;
  color: inherit;
  padding: 0;
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

.preview-content img {
  max-width: 100%;
  height: auto;
  margin: 20px 0;
  border-radius: 8px;
}

.preview-content a {
  color: #667eea;
  text-decoration: none;
}

.preview-content a:hover {
  text-decoration: underline;
}

.preview-content :deep(.copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  color: #2d5016;
  border: 1px solid #2d5016;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  font-weight: 600;
}

.preview-content :deep(.copy-btn:hover) {
  background: #f0f0f0;
}

/* 排版样式 */
:deep(.text-left) { text-align: left; }
:deep(.text-center) { text-align: center; }
:deep(.text-right) { text-align: right; }
:deep(.text-justify) { text-align: justify; }
:deep(mark) { background-color: #fff59d; padding: 0 4px; border-radius: 2px; }

.preview-section h3 {
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

/* 标签胶囊样式 */
.tags-capsule-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-bottom: 10px;
  min-height: 50px;
}

.tag-capsule {
  display: inline-block;
  padding: 6px 14px;
  background-color: #e0e0e0;
  color: #333;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none;
  font-size: 0.9rem;
}

.tag-capsule:hover {
  background-color: #d0d0d0;
  transform: translateY(-1px);
}

.tag-capsule.selected {
  background-color: #667eea;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

/* 上传提示样式 */
.upload-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 20px 30px;
  border-radius: 8px;
  z-index: 99999;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 表格对话框样式 */
.table-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.table-dialog-content {
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.form-row label {
  min-width: 60px;
  font-weight: 600;
  color: #333;
}

.form-row input[type="number"] {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
}

.table-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
}

.table-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.import-tip {
  background: #f0f4ff;
  border-left: 4px solid #667eea;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #333;
  font-size: 0.9rem;
}

.import-options {
  margin: 16px 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.import-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: #333;
}

.import-options input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
</style>
