import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 使用相对路径，通过 Nginx 反向代理到后端
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 博客相关API
export const blogApi = {
  // 获取所有博客
  getAll: () => api.get('/blog'),
  
  // 获取单篇博客
  getById: (id) => api.get(`/blog/${id}`),
  
  // 创建博客
  create: (data) => api.post('/blog', data),
  
  // 更新博客
  update: (id, data) => api.put(`/blog/${id}`, data),
  
  // 删除博客
  delete: (id) => api.delete(`/blog/${id}`)
};

// 文件上传API
export const uploadApi = {
  // 单文件上传
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 多文件上传
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// 留言相关API
export const commentApi = {
  // 获取某篇博客的留言
  getByBlogId: (blogId) => api.get(`/comments/${blogId}`),
  
  // 发布新留言
  create: (data) => api.post('/comments', data),
  
  // 删除留言（管理员功能）
  delete: (id) => api.delete(`/comments/${id}`)
};

export default api;
