// 身份验证工具函数
// 安全密钥（应该保存在后端，这里仅作示例）
const SECURITY_KEY = 'secure_admin_key_2026';

// 生成安全token
export function generateSecureToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const hash = btoa(`${SECURITY_KEY}:${timestamp}:${random}`);
  return {
    token: hash,
    timestamp: timestamp
  };
}

// 验证token的有效性
function validateToken(token, timestamp) {
  if (!token || !timestamp) return false;
  
  try {
    // 检查token格式
    const decoded = atob(token);
    if (!decoded.includes(SECURITY_KEY)) return false;
    
    // 检查token是否过期（24小时）
    const now = Date.now();
    const elapsed = now - parseInt(timestamp);
    const hours = elapsed / (1000 * 60 * 60);
    
    if (hours > 24) {
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Token验证失败:', err);
    return false;
  }
}

// 检查用户是否已登录
export function isAuthenticated() {
  const token = localStorage.getItem('adminToken');
  const loginTime = localStorage.getItem('loginTime');
  
  // 严格检查：两个条件都必须存在
  if (!token || !loginTime) {
    return false;
  }

  // 验证token的有效性
  if (!validateToken(token, loginTime)) {
    logout();
    return false;
  }

  return true;
}

// 登出
export function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('loginTime');
  localStorage.removeItem('loginAttempts');
  // 清空其他可能的session标记
  sessionStorage.clear();
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
