<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <h1>🔐 管理后台登录</h1>
        <p class="subtitle">请输入管理员密码</p>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="输入管理员密码..."
              required
              autofocus
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            {{ loading ? '验证中...' : '登录' }}
          </button>
        </form>

        <div class="login-footer">
          <router-link to="/">← 返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { generateSecureToken, isAuthenticated } from '../utils/auth';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const password = ref('');
    const loading = ref(false);
    const error = ref('');
    const loginAttempts = ref(0);
    const maxAttempts = 5;
    const lockoutTime = 15 * 60 * 1000; // 15分钟

    // 组件挂载时检查是否已登录
    onMounted(() => {
      // 如果已经登录，直接重定向到后台
      if (isAuthenticated()) {
        router.push('/admin');
      }

      // 检查是否有登录锁定
      const lockoutEndTime = localStorage.getItem('loginLockoutTime');
      if (lockoutEndTime) {
        const now = Date.now();
        const remainingTime = parseInt(lockoutEndTime) - now;
        
        if (remainingTime > 0) {
          const minutes = Math.ceil(remainingTime / (1000 * 60));
          error.value = `登录尝试过多，请在 ${minutes} 分钟后重试`;
          loading.value = true;
          setTimeout(() => {
            loading.value = false;
            error.value = '';
            localStorage.removeItem('loginLockoutTime');
            loginAttempts.value = 0;
          }, remainingTime);
        } else {
          // 锁定时间已过，清除锁定
          localStorage.removeItem('loginLockoutTime');
          loginAttempts.value = parseInt(localStorage.getItem('loginAttempts') || '0');
        }
      } else {
        loginAttempts.value = parseInt(localStorage.getItem('loginAttempts') || '0');
      }
    });

    const handleLogin = async () => {
      // 检查是否被锁定
      const lockoutEndTime = localStorage.getItem('loginLockoutTime');
      if (lockoutEndTime && Date.now() < parseInt(lockoutEndTime)) {
        const minutes = Math.ceil((parseInt(lockoutEndTime) - Date.now()) / (1000 * 60));
        error.value = `登录已锁定，请在 ${minutes} 分钟后重试`;
        return;
      }

      if (!password.value) {
        error.value = '请输入密码';
        return;
      }

      loading.value = true;
      error.value = '';

      // 密码验证（请在修改为你自己的密码）
      const ADMIN_PASSWORD = '123456';

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      if (password.value === ADMIN_PASSWORD) {
        // 登录成功，生成安全token
        const tokenData = generateSecureToken();
        localStorage.setItem('adminToken', tokenData.token);
        localStorage.setItem('loginTime', tokenData.timestamp.toString());
        
        // 清除登录尝试计数
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockoutTime');
        loginAttempts.value = 0;

        // 跳转到管理页面
        router.push('/admin');
      } else {
        // 登录失败，增加尝试次数
        loginAttempts.value++;
        localStorage.setItem('loginAttempts', loginAttempts.value.toString());

        if (loginAttempts.value >= maxAttempts) {
          // 达到最大尝试次数，锁定账户
          const lockoutEndTime = Date.now() + lockoutTime;
          localStorage.setItem('loginLockoutTime', lockoutEndTime.toString());
          error.value = `登录尝试过多，账户已锁定 15 分钟，请稍后再试`;
          password.value = '';
        } else {
          const remaining = maxAttempts - loginAttempts.value;
          error.value = `密码错误（还有 ${remaining} 次尝试机会）`;
          password.value = '';
        }
      }

      loading.value = false;
    };

    return {
      password,
      loading,
      error,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  text-align: center;
  font-size: 1.8em;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 32px;
  font-size: 0.95em;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

input[type="password"] {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s;
  box-sizing: border-box;
}

input[type="password"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9em;
  text-align: center;
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-size: 0.9em;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
