<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo/Brand -->
      <router-link to="/" class="header-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">主页</span>
      </router-link>
      
      <!-- Navigation -->
      <nav class="header-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'nav-link-active': isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      
      <!-- Mobile Menu Toggle -->
      <button class="menu-toggle" @click="toggleMobileMenu" aria-label="Toggle menu">
        <span class="hamburger"></span>
      </button>
    </div>
    
    <!-- Mobile Menu Dropdown -->
    <nav v-if="mobileMenuOpen" class="mobile-menu">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-menu-link"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </header>
</template>

<script>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'Header',
  setup() {
    const route = useRoute();
    const mobileMenuOpen = ref(false);
    
    const navItems = [
      { path: '/blog', label: '博客', icon: '📝' },
      { path: '/maps', label: '地图', icon: '🗺️' },
      { path: '/about', label: '关于', icon: '👨‍💻' }
    ];
    
    const isActive = (path) => route.path === path;
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    };
    
    return {
      navItems,
      isActive,
      toggleMobileMenu,
      mobileMenuOpen
    };
  }
}
</script>

<style scoped>
/* ========== 头部容器 ========== */
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(45, 62, 45, 0.08);
}

.header-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ========== Logo/Brand ========== */
.header-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  transition: all var(--transition-base);
}

.logo-icon {
  font-size: 1.5em;
  animation: pulse-glow 2s ease-in-out infinite;
}

.header-logo:hover {
  color: var(--color-primary-dark);
  transform: scale(1.05);
}

.logo-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ========== 导航菜单 ========== */
.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  position: relative;
}

.nav-link:hover {
  color: var(--color-primary);
  background: rgba(107, 156, 47, 0.05);
}

.nav-link-active {
  color: var(--color-primary);
  background: rgba(107, 156, 47, 0.08);
}

.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(107, 156, 47, 0.4);
}

.nav-icon {
  font-size: 1.1em;
}

.nav-label {
  @media (max-width: 568px) {
    display: none;
  }
}

/* ========== 移动菜单切换按钮 ========== */
.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--spacing-sm);
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.hamburger {
  display: block;
  width: 24px;
  height: 16px;
  position: relative;
  
  &::before,
  &::after,
  & {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background: var(--color-text-primary);
    border-radius: 1px;
    transition: all var(--transition-base);
  }
  
  &::before {
    top: 0;
  }
  
  &::after {
    bottom: 0;
  }
}

.menu-toggle:hover .hamburger,
.menu-toggle:focus .hamburger {
  background: var(--color-primary);
}

/* ========== 移动菜单 ========== */
.mobile-menu {
  display: none;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  
  @media (max-width: 768px) {
    display: flex;
  }
}

.mobile-menu-link {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.mobile-menu-link:hover {
  background: rgba(0, 217, 255, 0.1);
  color: var(--color-primary);
  padding-left: calc(var(--spacing-lg) + 8px);
}

/* ========== 动画 ========== */
@keyframes pulse-glow {
  0%, 100% {
    text-shadow: 0 0 8px rgba(107, 156, 47, 0.3);
  }
  50% {
    text-shadow: 0 0 16px rgba(107, 156, 47, 0.6);
  }
}

/* ========== 响应式调整 ========== */
@media (max-width: 768px) {
  .header-container {
    padding: var(--spacing-md) var(--spacing-lg);
  }
  
  .header-nav {
    display: none;
  }
  
  .nav-label {
    display: none;
  }
}
</style>
