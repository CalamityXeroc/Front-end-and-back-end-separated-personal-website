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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleLogin = async () => {
      loading.value = true;
      error.value = '';

      // 简单的密码验证（实际环境中应该调用后端API验证）
      // 你可以修改这里的密码
      const ADMIN_PASSWORD = '123456'; // 请修改为你自己的密码

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      if (password.value === ADMIN_PASSWORD) {
        // 登录成功，保存token到localStorage
        const token = btoa(`admin:${Date.now()}`); // 简单的token生成
        localStorage.setItem('adminToken', token);
        localStorage.setItem('loginTime', Date.now().toString());
        
        // 跳转到管理页面
        router.push('/admin');
      } else {
        error.value = '密码错误，请重试';
        password.value = '';
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
