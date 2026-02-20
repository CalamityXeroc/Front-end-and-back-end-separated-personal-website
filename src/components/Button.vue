<template>
  <button
    :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-disabled': disabled }]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <span class="btn-content">
      <slot />
    </span>
    <span v-if="variant === 'primary'" class="btn-shimmer"></span>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
/* ========== 基础按钮样式 ========== */
.btn {
  position: relative;
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: var(--font-family-base);
  overflow: hidden;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ========== 尺寸变体 ========== */
.btn-sm {
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  height: 32px;
}

.btn-md {
  font-size: var(--font-size-base);
  padding: var(--spacing-md) var(--spacing-2xl);
  height: 40px;
}

.btn-lg {
  font-size: var(--font-size-lg);
  padding: var(--spacing-lg) var(--spacing-3xl);
  height: 48px;
}

/* ========== 样式变体 ========== */

/* 主按钮 - 电光蓝渐变 + 霓虹阴影 */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(107, 156, 47, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  box-shadow: 0 8px 24px rgba(107, 156, 47, 0.3);
  transform: translateY(-2px) scale(1.02);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 4px 12px rgba(107, 156, 47, 0.15);
}

/* 次要按钮 - 透明 + 边框 */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(107, 156, 47, 0.05);
  border-color: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(107, 156, 47, 0.1);
}

.btn-secondary:active:not(:disabled) {
  background: rgba(0, 217, 255, 0.2);
}

/* 幽灵按钮 - 最小化样式 */
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid rgba(107, 156, 47, 0.2);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(107, 156, 47, 0.05);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 危险按钮 - 深红色 */
.btn-danger {
  background: var(--color-error);
  color: #fff;
  box-shadow: 0 4px 12px rgba(214, 40, 40, 0.2);
}

.btn-danger:hover:not(:disabled) {
  background: #c91e1e;
  box-shadow: 0 8px 24px rgba(214, 40, 40, 0.3);
  transform: translateY(-2px);
}

/* ========== 禁用状态 ========== */
.btn-disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ========== 内容与闪光效果 ========== */
.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
}

/* 闪光动效（仅主按钮） */
.btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}
</style>
