// 身份验证工具函数

// 检查用户是否已登录
export function isAuthenticated() {
  const token = localStorage.getItem('adminToken');
  const loginTime = localStorage.getItem('loginTime');
  
  if (!token || !loginTime) {
    return false;
  }

  // 检查token是否过期（24小时）
  const now = Date.now();
  const elapsed = now - parseInt(loginTime);
  const hours = elapsed / (1000 * 60 * 60);
  
  if (hours > 24) {
    // Token过期，清除数据
    logout();
    return false;
  }

  return true;
}

// 登出
export function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('loginTime');
}

// 获取登录时长
export function getLoginDuration() {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return null;

  const now = Date.now();
  const elapsed = now - parseInt(loginTime);
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
}
