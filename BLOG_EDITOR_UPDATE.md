# BlogEditor 完整更新指南

## 第一步：添加工具栏函数（在 `handleSubmit` 函数之后，`onMounted` 之前添加）

找到文件中的这几行：
```javascript
    };

    onMounted(() => {
```

在它们之间添加以下代码：

```javascript
    };

    // ===== 添加以下代码 =====
    
    // Markdown 工具栏功能
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
    
    // ===== 以上代码添加完毕 =====

    onMounted(() => {
```

## 第二步：更新 return 语句

找到：
```javascript
    return {
      form,
      tagsInput,
      loading,
      submitting,
      isEdit,
      renderedContent,
      handleSubmit
    };
```

替换为：
```javascript
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
```

## 完成！

保存文件后，刷新浏览器即可看到：
- ✅ Markdown 工具栏（H1, H2, H3, 粗体, 斜体等）
- ✅ 插入图片按钮
- ✅ 图片URL和上传两种模式
- ✅ 实时 Markdown 预览

## 使用方法

1. **标题**：点击 H1/H2/H3 按钮，或直接输入 `# 标题`
2. **粗体**：选中文字点击 B，或输入 `**粗体**`
3. **插入图片**：
   - 方式1：点击"插入图片"按钮，输入图片URL
   - 方式2：选择上传，选择图片文件（记得复制到public/picture/目录）
   - 方式3：直接输入 `![描述](/picture/image.jpg)`

## 图片使用说明

如果使用"上传图片"功能：
1. 选择图片文件
2. 系统会插入Markdown代码：`![文件名](/picture/文件名)`
3. **重要**：手动将图片文件复制到 `public/picture/` 目录
4. 刷新预览即可看到图片
