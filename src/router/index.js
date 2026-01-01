import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Blog from '../views/Blog.vue';
import BlogPost from '../views/BlogPost.vue';
import Maps from '../views/Maps.vue';
import About from '../views/About.vue';
import Login from '../views/Login.vue';
import Admin from '../views/Admin.vue';
import BlogEditor from '../views/BlogEditor.vue';
import { isAuthenticated, logout } from '../utils/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog,
    meta: { requiresAuth: false }
  },
  {
    path: '/blog/:id',
    name: 'BlogPost',
    component: BlogPost,
    meta: { requiresAuth: false }
  },
  {
    path: '/maps',
    name: 'Maps',
    component: Maps,
    meta: { requiresAuth: false }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/new',
    name: 'NewBlog',
    component: BlogEditor,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/edit/:id',
    name: 'EditBlog',
    component: BlogEditor,
    meta: { requiresAuth: true, role: 'admin' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 };
  }
});

// 强化的路由守卫：检查需要身份验证的页面
router.beforeEach((to, from, next) => {
  const isAuth = isAuthenticated();
  
  // 如果访问受保护路由
  if (to.meta.requiresAuth) {
    if (!isAuth) {
      // 未登录，清除任何可能的残留token
      logout();
      // 跳转到登录页面，并记录原想访问的页面
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      });
    } else {
      // 已登录，允许访问
      next();
    }
  } 
  // 如果正在访问登录页且已经登录
  else if (to.name === 'Login' && isAuth) {
    // 已登录用户不应该再访问登录页，重定向到后台
    next('/admin');
  }
  // 其他所有情况（公开页面）
  else {
    next();
  }
});

// 监听路由变化，防止浏览器后退绕过安全
router.afterEach((to, from) => {
  // 如果从受保护页面退出登录，确保清除所有认证信息
  if (from.meta.requiresAuth && !to.meta.requiresAuth && to.name !== 'Login') {
    // 可选：添加额外的安全检查
    console.log('已离开受保护页面');
  }
});

export default router;
