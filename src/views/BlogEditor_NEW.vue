// 工具栏功能代码片段 - 添加到 BlogEditor.vue 的 return 之前

    // Markdown 工具栏功能
    const insertMarkdown = (before, after) => {
      const textarea = contentTextarea.value;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = form.value.content.substring(start, end);
      const newText = form.value.content.substring(0, start) + before + selectedText + after + form.value.content.substring(end);
      
      form.value.content = newText;
      
      // 恢复光标位置
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
      
      // 重置并关闭对话框
      imageUrl.value = '';
      imageAlt.value = '';
      showImageDialog.value = false;
      
      setTimeout(() => {
        textarea.focus();
      }, 0);
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
          if (uploadProgress.value < 90) {
            uploadProgress.value += 10;
          }
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        uploadProgress.value = 100;

        const imagePath = `/picture/${file.name}`;
        const markdownImage = `![${file.name}](${imagePath})`;
        const textarea = contentTextarea.value;
        const start = textarea.selectionStart;
        form.value.content = form.value.content.substring(0, start) + markdownImage + form.value.content.substring(start);
        
        alert(`✅ 图片已插入！\n请将图片文件 "${file.name}" 手动复制到 public/picture/ 目录`);
        
        showImageDialog.value = false;
        uploadProgress.value = 0;
        
        setTimeout(() => {
          textarea.focus();
        }, 0);
      } catch (err) {
        alert('❌ 上传失败：' + err.message);
        uploadProgress.value = 0;
      }
    };
