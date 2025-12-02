import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Blog from '../views/Blog.vue';
import BlogPost from '../views/BlogPost.vue';
import Maps from '../views/Maps.vue';
import About from '../views/About.vue';
import Login from '../views/Login.vue';
import Admin from '../views/Admin.vue';
import BlogEditor from '../views/BlogEditor.vue';
import { isAuthenticated } from '../utils/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/blog/:id',
    name: 'BlogPost',
    component: BlogPost
  },
  {
    path: '/maps',
    name: 'Maps',
    component: Maps
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/new',
    name: 'NewBlog',
    component: BlogEditor,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/edit/:id',
    name: 'EditBlog',
    component: BlogEditor,
    meta: { requiresAuth: true }
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

// 路由守卫：检查需要身份验证的页面
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    if (isAuthenticated()) {
      next(); // 已登录，允许访问
    } else {
      next('/login'); // 未登录，跳转到登录页
    }
  } else {
    next(); // 不需要验证的页面，直接放行
  }
});

export default router;
