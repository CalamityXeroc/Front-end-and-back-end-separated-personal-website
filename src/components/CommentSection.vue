<template>
  <div class="comment-section">
    <h3 class="section-title"> 留言区</h3>

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
      <p>还没有留言，快来抢沙发吧！</p>
    </div>

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
          {{ submitting ? '发送中...' : ' 发送留言' }}
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
          alert(' 留言成功！');
          form.value.content = '';
          await fetchComments();
        }
      } catch (err) {
        alert(' 留言失败：' + (err.response?.data?.message || err.message));
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
  margin-top: var(--spacing-5xl);
  padding-top: var(--spacing-4xl);
  border-top: 1px solid var(--color-border);
}

.section-title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-3xl);
  color: var(--color-text-primary);
  border-left: 4px solid var(--color-primary);
  padding-left: 12px;
}

.comments-list {
  margin-bottom: var(--spacing-4xl);
}

.comment-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #edf3ed;
}

.comment-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
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
  color: var(--color-text-primary);
}

.date {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.comment-text {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
  white-space: pre-wrap;
}

.empty-comments {
  text-align: center;
  padding: var(--spacing-4xl);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4xl);
}

.comment-form {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--color-border);
  padding: var(--spacing-3xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft-sm);
}

.comment-form h4 {
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--color-text-primary);
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
  border: 1px solid #d8e6d8;
  border-radius: var(--radius-md);
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 156, 47, 0.12);
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft-md);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .comment-header {
    flex-direction: column;
    gap: 4px;
  }

  .comment-form {
    padding: var(--spacing-lg);
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
