<template>
  <header class="header" :class="{ 'header-mobile-open': mobileMenuOpen }">
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
      <button
        class="menu-toggle"
        @click="toggleMobileMenu"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-nav"
        aria-label="切换导航菜单"
      >
        <span class="hamburger"></span>
      </button>
    </div>
    
    <!-- Mobile Menu Dropdown -->
    <nav v-if="mobileMenuOpen" id="mobile-nav" class="mobile-menu">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-menu-link"
        @click="closeMobileMenu"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </header>
</template>

<script>
import { ref, watch, onBeforeUnmount } from 'vue';
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

    const setBodyLock = (locked) => {
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('menu-open', locked);
      }
    };
    
    const isActive = (path) => route.path === path;

    const closeMobileMenu = () => {
      mobileMenuOpen.value = false;
      setBodyLock(false);
    };

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
      setBodyLock(mobileMenuOpen.value);
    };

    watch(
      () => route.path,
      () => {
        closeMobileMenu();
      }
    );

    onBeforeUnmount(() => {
      setBodyLock(false);
    });
    
    return {
      navItems,
      isActive,
      toggleMobileMenu,
      closeMobileMenu,
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
  background: rgba(248, 254, 251, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(45, 62, 45, 0.08);
}

.header-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-xl);
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
  gap: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  color: #000;
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  position: relative;
  border: 1px solid transparent;
}

.nav-link:hover {
  color: #000;
  background: rgba(107, 156, 47, 0.08);
  border-color: rgba(107, 156, 47, 0.2);
}

.nav-link-active {
  color: #000;
  background: rgba(107, 156, 47, 0.14);
  border-color: rgba(107, 156, 47, 0.35);
}

.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #000;
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
  min-width: 44px;
  min-height: 44px;
  
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
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: var(--z-mobile-menu);
  background: rgba(248, 254, 251, 0.98);
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 72px);
  overflow-y: auto;
  box-shadow: var(--shadow-soft-md);
  
  @media (max-width: 768px) {
    display: flex;
  }
}

.mobile-menu-link {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.mobile-menu-link:hover {
  background: rgba(107, 156, 47, 0.1);
  color: #000;
  padding-left: calc(var(--spacing-lg) + 8px);
}

.mobile-menu-link.router-link-active {
  background: rgba(107, 156, 47, 0.14);
  color: #000;
  border: 1px solid rgba(107, 156, 47, 0.28);
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

  .mobile-menu {
    position: static;
    left: auto;
    right: auto;
    top: auto;
    border: 1px solid var(--color-border);
    border-top: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    gap: 6px;
    max-height: min(62vh, 420px);
    margin: 0 var(--spacing-lg) var(--spacing-sm);
  }

  .mobile-menu-link {
    padding: 12px 14px;
  }
  
  .header-nav {
    display: none;
  }
  
  .nav-label {
    display: none;
  }
}
</style>
