<template>
  <div class="admin">
    <div class="admin-header">
      <div class="header-left">
        <h1>📝 博客管理后台</h1>
        <span class="welcome-text">欢迎，管理员</span>
      </div>
      <div class="header-right">
        <router-link to="/admin/new" class="btn-new">+ 写新博客</router-link>
        <button @click="handleLogout" class="btn-logout">🚪 退出登录</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="blog-list">
      <div v-if="blogs.length === 0" class="empty">
        <p>还没有博客，点击上方按钮创建第一篇吧！</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>作者</th>
              <th>标签</th>
              <th>浏览量</th>
              <th>留言数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="blog in blogs" :key="blog.id">
              <td>{{ blog.id }}</td>
              <td class="title-cell">{{ blog.title }}</td>
              <td>{{ blog.author }}</td>
              <td>
                <span v-for="tag in blog.tags" :key="tag" class="tag">{{ tag }}</span>
              </td>
              <td>{{ blog.views }}</td>
              <td>{{ blog.commentCount || 0 }}</td>
              <td>{{ formatDate(blog.createdAt) }}</td>
              <td class="actions">
                <button @click="viewComments(blog.id)" class="btn-comments">
                  💬 留言
                </button>
                <router-link :to="`/blog/${blog.id}`" class="btn-view" target="_blank">
                  👁️ 查看
                </router-link>
                <router-link :to="`/admin/edit/${blog.id}`" class="btn-edit">
                  ✏️ 编辑
                </router-link>
                <button @click="deleteBlog(blog.id)" class="btn-delete">
                  🗑️ 删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 留言管理弹窗 -->
    <div v-if="showCommentsModal" class="modal-overlay" @click="closeCommentsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>💬 留言管理 - {{ currentBlogTitle }}</h3>
          <button @click="closeCommentsModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingComments" class="loading-small">加载中...</div>
          <div v-else-if="currentComments.length === 0" class="empty-small">
            暂无留言
          </div>
          <div v-else class="comments-list">
            <div v-for="comment in currentComments" :key="comment.id" class="comment-item">
              <div class="comment-info">
                <span class="comment-author">{{ comment.nickname }}</span>
                <span class="comment-email">({{ comment.email }})</span>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <button @click="deleteComment(comment.id)" class="btn-delete-small">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { blogApi, commentApi } from '../api/index';
import { logout } from '../utils/auth';

export default {
  name: 'Admin',
  setup() {
    const router = useRouter();
    const blogs = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // 留言管理相关状态
    const showCommentsModal = ref(false);
    const currentComments = ref([]);
    const currentBlogTitle = ref('');
    const loadingComments = ref(false);

    const fetchBlogs = async () => {
      loading.value = true;
      try {
        const response = await blogApi.getAll();
        if (response.success) {
          blogs.value = response.data;
        }
      } catch (err) {
        error.value = '加载博客列表失败';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const viewComments = async (blogId) => {
      const blog = blogs.value.find(b => b.id === blogId);
      if (blog) {
        currentBlogTitle.value = blog.title;
        showCommentsModal.value = true;
        loadingComments.value = true;
        try {
          const response = await commentApi.getByBlogId(blogId);
          if (response.success) {
            currentComments.value = response.data;
          }
        } catch (err) {
          console.error('获取留言失败:', err);
          alert('获取留言失败');
        } finally {
          loadingComments.value = false;
        }
      }
    };

    const deleteComment = async (commentId) => {
      if (!confirm('确定要删除这条留言吗？')) return;
      
      try {
        await commentApi.delete(commentId);
        // 从列表中移除
        currentComments.value = currentComments.value.filter(c => c.id !== commentId);
        alert('删除成功');
      } catch (err) {
        console.error('删除留言失败:', err);
        alert('删除失败');
      }
    };

    const closeCommentsModal = () => {
      showCommentsModal.value = false;
      currentComments.value = [];
    };

    const deleteBlog = async (id) => {
      if (!confirm('确定要删除这篇博客吗？此操作无法撤销！')) {
        return;
      }

      try {
        await blogApi.delete(id);
        alert('删除成功！');
        fetchBlogs(); // 重新加载列表
      } catch (err) {
        alert('删除失败：' + err.message);
        console.error(err);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const handleLogout = () => {
      if (confirm('确定要退出登录吗？')) {
        logout();
        router.push('/login');
      }
    };

    onMounted(() => {
      fetchBlogs();
    });

    return {
      blogs,
      loading,
      error,
      formatDate,
      deleteBlog,
      handleLogout,
      // 留言相关
      showCommentsModal,
      currentComments,
      currentBlogTitle,
      loadingComments,
      viewComments,
      deleteComment,
      closeCommentsModal
    };
  }
};
</script>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.admin-header h1 {
  margin: 0;
  color: #2c3e50;
}

.welcome-text {
  color: #7f8c8d;
  font-size: 0.9em;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-new {
  background: #42b983;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn-new:hover {
  background: #369970;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.btn-logout {
  background: #e74c3c;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.loading, .error, .empty {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.1em;
}

.error {
  color: #e74c3c;
}

.empty {
  color: #7f8c8d;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

tbody tr:hover {
  background: #f8f9fa;
}

.title-cell {
  font-weight: 500;
  color: #2c3e50;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-right: 4px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-view, .btn-edit, .btn-delete {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9em;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-view:hover {
  background: #1976d2;
  color: white;
}

.btn-edit {
  background: #fff3e0;
  color: #f57c00;
}

.btn-edit:hover {
  background: #f57c00;
  color: white;
}

.btn-delete {
  background: #ffebee;
  color: #c62828;
}

.btn-delete:hover {
  background: #c62828;
  color: white;
}

.btn-comments {
  padding: 6px 12px;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-comments:hover {
  background: #e67e22;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.btn-close:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.loading-small, .empty-small {
  text-align: center;
  padding: 30px;
  color: #999;
}

.loading-small {
  color: #3498db;
}

.empty-small {
  color: #7f8c8d;
}

.comments-list {
  margin-top: 16px;
}

.comment-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-info {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.comment-author {
  font-weight: bold;
  color: #333;
}

.comment-email {
  color: #666;
}

.comment-date {
  color: #999;
  margin-left: auto;
}

.comment-text {
  margin: 0 0 10px 0;
  color: #555;
  line-height: 1.5;
}

.btn-delete-small {
  padding: 4px 8px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-delete-small:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}
</style>
