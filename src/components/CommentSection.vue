<template>
  <div class="comment-section">
    <h3 class="section-title">💬 留言区</h3>

    <!-- 留言列表 -->
    <div class="comments-list" v-if="comments.length > 0">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          {{ comment.nickname.charAt(0).toUpperCase() }}
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="nickname">{{ comment.nickname }}</span>
            <span class="date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <p class="comment-text">{{ comment.content }}</p>
        </div>
      </div>
    </div>
    <div v-else class="empty-comments">
      <p>还没有留言，快来抢沙发吧！🛋️</p>
    </div>

    <!-- 留言表单 -->
    <div class="comment-form">
      <h4>发表留言</h4>
      <form @submit.prevent="submitComment">
        <div class="form-row">
          <div class="form-group">
            <input 
              v-model="form.nickname" 
              type="text" 
              placeholder="昵称 *" 
              required 
              maxlength="20"
            />
          </div>
          <div class="form-group">
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="邮箱 * (保密)" 
              required 
            />
          </div>
        </div>
        <div class="form-group">
          <textarea 
            v-model="form.content" 
            placeholder="写下你的想法..." 
            required 
            rows="4"
          ></textarea>
        </div>
        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? '发送中...' : '🚀 发送留言' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { commentApi } from '../api/index';

export default {
  name: 'CommentSection',
  props: {
    blogId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const comments = ref([]);
    const submitting = ref(false);
    const form = ref({
      nickname: '',
      email: '',
      content: ''
    });

    const fetchComments = async () => {
      try {
        const response = await commentApi.getByBlogId(props.blogId);
        if (response.success) {
          comments.value = response.data;
        }
      } catch (err) {
        console.error('获取留言失败:', err);
      }
    };

    const submitComment = async () => {
      submitting.value = true;
      try {
        const response = await commentApi.create({
          blogId: props.blogId,
          ...form.value
        });
        
        if (response.success) {
          alert('✅ 留言成功！');
          // 清空表单
          form.value.content = '';
          // 重新获取留言列表
          await fetchComments();
        }
      } catch (err) {
        alert('❌ 留言失败：' + (err.response?.data?.message || err.message));
      } finally {
        submitting.value = false;
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

    onMounted(() => {
      fetchComments();
    });

    return {
      comments,
      form,
      submitting,
      submitComment,
      formatDate
    };
  }
};
</script>

<style scoped>
.comment-section {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid #eee;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 30px;
  color: #333;
  border-left: 4px solid #667eea;
  padding-left: 12px;
}

.comments-list {
  margin-bottom: 40px;
}

.comment-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f5f5f5;
}

.comment-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.nickname {
  font-weight: 600;
  color: #333;
}

.date {
  font-size: 0.85rem;
  color: #999;
}

.comment-text {
  color: #555;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.empty-comments {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 40px;
}

.comment-form {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
}

.comment-form h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
