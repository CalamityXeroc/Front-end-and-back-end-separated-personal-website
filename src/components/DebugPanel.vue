<!--
前端调试工具 - 检查编辑器中加载的内容是否完整
放在 src/views/BlogEditor.vue 之前使用
-->

<template>
  <div id="debug-panel" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: #0f0;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 9999;
    border: 2px solid #0f0;
  ">
    <div style="margin-bottom: 10px; font-weight: bold; color: #0ff;">📋 编辑器调试信息</div>
    <div v-if="editorState">
      <div>编辑框内容长度: {{ editorState.contentLength }} 字符</div>
      <div>标题: {{ editorState.title }}</div>
      <div style="margin-top: 10px; color: #ff0;">⚠️ 问题检查：</div>
      <div v-if="editorState.contentLength > 0">
        ✅ 内容已加载
      </div>
      <div v-else style="color: #f00;">
        ❌ 内容为空
      </div>
      <div style="margin-top: 10px;">
        <button @click="copyContent" style="
          background: #0f0;
          color: #000;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
        ">复制内容到剪贴板</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    form: Object
  },
  data() {
    return {
      editorState: null
    };
  },
  watch: {
    form: {
      handler(newVal) {
        if (newVal) {
          this.editorState = {
            title: newVal.title,
            contentLength: newVal.content ? newVal.content.length : 0
          };
        }
      },
      deep: true
    }
  },
  methods: {
    copyContent() {
      if (this.form && this.form.content) {
        navigator.clipboard.writeText(this.form.content).then(() => {
          alert('✅ 内容已复制到剪贴板');
        });
      }
    }
  },
  mounted() {
    if (this.form) {
      this.editorState = {
        title: this.form.title,
        contentLength: this.form.content ? this.form.content.length : 0
      };
    }
  }
};
</script>
