<template>
  <div :class="['card', `card-${variant}`, { 'card-hoverable': hoverable }]">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'highlight', 'minimal'].includes(value)
    },
    hoverable: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
/* ========== 卡片基础样式 ========== */
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
}

/* 可悬停的卡片 */
.card-hoverable:hover {
  border-color: var(--color-border-hover);
  box-shadow: 
    0 8px 24px rgba(107, 156, 47, 0.12);
  transform: translateY(-4px);
}

/* ========== 内部结构 ========== */
.card-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.card-body {
  padding: var(--spacing-xl);
}

.card-footer {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

/* ========== 样式变体 ========== */

/* 默认卡片 - 毛玻璃效果 */
.card-default {
  background: #FFFFFF;
}

/* 高亮卡片 - 加强视觉 */
.card-highlight {
  background: #F2F7F4;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.08);
}

.card-highlight.card-hoverable:hover {
  box-shadow: 
    0 8px 24px rgba(237, 239, 233, 0.12);
}

/* 极简卡片 - 最小化设计 */
.card-minimal {
  background: transparent;
  border: 1px solid rgba(160, 168, 192, 0.2);
}

.card-minimal.card-hoverable:hover {
  background: rgba(0, 217, 255, 0.03);
  border-color: rgba(0, 217, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 217, 255, 0.08);
}
</style>
