<template>
  <div class="comment-section">
    <h3 class="section-title"> 留言区</h3>

    <div class="comments-list" v-if="flattenedComments.length > 0">
      <div
        v-for="comment in flattenedComments"
        :key="`comment-${comment.id}`"
        class="comment-item"
        :style="{ '--comment-depth': Math.min(comment.depth, 6) }"
      >
        <div class="comment-avatar">
          {{ getAvatarText(comment.nickname) }}
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="nickname">{{ safeNickname(comment.nickname) }}</span>
            <span class="date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <p class="comment-text">{{ safeContent(comment.content) }}</p>

          <div class="comment-actions">
            <button class="action-btn" @click="openReply(comment)">回复</button>
            <button
              class="action-btn like-btn"
              :class="{ liked: !!comment.likedByCurrentVisitor }"
              :disabled="likingIds.includes(comment.id)"
              @click="likeComment(comment)"
            >
              👍 {{ Number(comment.likesCount || 0) }}
            </button>
          </div>

          <div v-if="replyingToId === comment.id" class="reply-form">
            <textarea
              v-model="replyContent"
              placeholder="写下你的回复..."
              rows="3"
            ></textarea>
            <div class="reply-actions">
              <button class="btn-subtle" @click="cancelReply">取消</button>
              <button class="btn-submit" :disabled="submitting || !replyContent.trim()" @click="submitReply(comment)">
                {{ submitting ? '发送中...' : '发布回复' }}
              </button>
            </div>
          </div>
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
          {{ submitting ? '发送中...' : '发送留言' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
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
    const commentsTree = ref([]);
    const submitting = ref(false);
    const replyingToId = ref(null);
    const replyContent = ref('');
    const likingIds = ref([]);
    const visitorKey = ref('');

    const form = ref({
      nickname: '',
      email: '',
      content: ''
    });

    const toSafeComment = (raw = {}) => ({
      id: Number(raw.id),
      blogId: Number(raw.blogId || props.blogId),
      nickname: safeNickname(raw.nickname),
      email: raw.email || '',
      content: safeContent(raw.content),
      parentId: raw.parentId === undefined || raw.parentId === '' ? null : Number(raw.parentId),
      likesCount: Number.isFinite(Number(raw.likesCount)) ? Number(raw.likesCount) : 0,
      createdAt: raw.createdAt || raw.updatedAt || new Date().toISOString(),
      likedByCurrentVisitor: !!raw.likedByCurrentVisitor,
      children: Array.isArray(raw.children) ? raw.children.map(toSafeComment) : []
    });

    const buildTreeFromFlat = (list) => {
      const map = new Map();
      const roots = [];
      list.forEach((item) => {
        const comment = toSafeComment(item);
        comment.children = [];
        map.set(comment.id, comment);
      });

      map.forEach((comment) => {
        if (comment.parentId && map.has(comment.parentId)) {
          map.get(comment.parentId).children.push(comment);
        } else {
          roots.push(comment);
        }
      });

      return roots;
    };

    const flattenTree = (nodes, depth = 0, acc = []) => {
      nodes.forEach((node) => {
        acc.push({ ...node, depth });
        if (Array.isArray(node.children) && node.children.length > 0) {
          flattenTree(node.children, depth + 1, acc);
        }
      });
      return acc;
    };

    const flattenedComments = computed(() => flattenTree(commentsTree.value));

    const safeNickname = (nickname) => {
      const value = typeof nickname === 'string' ? nickname.trim() : '';
      return value || '访客';
    };

    const safeContent = (content) => {
      const value = typeof content === 'string' ? content.trim() : '';
      return value || '[无内容]';
    };

    const getAvatarText = (nickname) => safeNickname(nickname).charAt(0).toUpperCase();

    const ensureVisitorKey = () => {
      const keyName = 'comment_visitor_key';
      const fromStorage = localStorage.getItem(keyName);
      if (fromStorage) {
        visitorKey.value = fromStorage;
        return;
      }

      const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const generated = `vk_${seed}`;
      localStorage.setItem(keyName, generated);
      visitorKey.value = generated;
    };

    const fetchComments = async () => {
      try {
        const response = await commentApi.getByBlogId(props.blogId, {
          tree: true,
          visitorKey: visitorKey.value
        });

        if (response.success) {
          if (Array.isArray(response.data) && response.data.some((item) => Array.isArray(item.children))) {
            commentsTree.value = response.data.map(toSafeComment);
          } else {
            commentsTree.value = buildTreeFromFlat(Array.isArray(response.data) ? response.data : []);
          }
        }
      } catch (err) {
        console.error('获取留言失败:', err);
        commentsTree.value = [];
      }
    };

    const resetReplyState = () => {
      replyingToId.value = null;
      replyContent.value = '';
    };

    const openReply = (comment) => {
      replyingToId.value = comment.id;
      replyContent.value = '';
    };

    const cancelReply = () => {
      resetReplyState();
    };

    const submitComment = async () => {
      submitting.value = true;
      try {
        const response = await commentApi.create({
          blogId: props.blogId,
          parentId: null,
          ...form.value
        });

        if (response.success) {
          alert('留言成功！');
          form.value.content = '';
          await fetchComments();
        }
      } catch (err) {
        alert('留言失败：' + (err.response?.data?.message || err.message));
      } finally {
        submitting.value = false;
      }
    };

    const submitReply = async (parentComment) => {
      if (!replyContent.value.trim()) return;

      if (!form.value.nickname.trim() || !form.value.email.trim()) {
        alert('请先填写昵称和邮箱，再发布回复。');
        return;
      }

      submitting.value = true;
      try {
        const response = await commentApi.create({
          blogId: props.blogId,
          parentId: parentComment.id,
          nickname: form.value.nickname,
          email: form.value.email,
          content: replyContent.value
        });

        if (response.success) {
          resetReplyState();
          await fetchComments();
        }
      } catch (err) {
        alert('回复失败：' + (err.response?.data?.message || err.message));
      } finally {
        submitting.value = false;
      }
    };

    const likeComment = async (comment) => {
      if (likingIds.value.includes(comment.id) || comment.likedByCurrentVisitor) {
        return;
      }

      likingIds.value = [...likingIds.value, comment.id];

      try {
        const response = await commentApi.like(comment.id, visitorKey.value);
        if (!response.success) {
          throw new Error(response.message || '点赞失败');
        }
        await fetchComments();
      } catch (err) {
        alert('点赞失败：' + (err.response?.data?.message || err.message));
      } finally {
        likingIds.value = likingIds.value.filter((id) => id !== comment.id);
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) {
        return '日期未知';
      }
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return '日期未知';
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      ensureVisitorKey();
      fetchComments();
    });

    return {
      flattenedComments,
      form,
      submitting,
      replyingToId,
      replyContent,
      likingIds,
      submitComment,
      submitReply,
      openReply,
      cancelReply,
      likeComment,
      formatDate,
      safeNickname,
      safeContent,
      getAvatarText
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
  margin-left: calc(var(--comment-depth) * 16px);
  position: relative;
}

.comment-item::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 6px;
  width: 2px;
  height: calc(100% - 12px);
  background: rgba(107, 156, 47, 0.15);
  display: none;
}

.comment-item[style*='--comment-depth: 0']::before {
  display: none;
}

.comment-item[style*='--comment-depth: 1']::before,
.comment-item[style*='--comment-depth: 2']::before,
.comment-item[style*='--comment-depth: 3']::before,
.comment-item[style*='--comment-depth: 4']::before,
.comment-item[style*='--comment-depth: 5']::before,
.comment-item[style*='--comment-depth: 6']::before {
  display: block;
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

.comment-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.action-btn {
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.like-btn.liked {
  border-color: rgba(226, 58, 98, 0.35);
  background: rgba(226, 58, 98, 0.08);
  color: #b62249;
}

.reply-form {
  margin-top: 12px;
  background: #f8fbf7;
  border: 1px solid #e3ede1;
  border-radius: var(--radius-md);
  padding: 10px;
}

.reply-form textarea {
  width: 100%;
  border: 1px solid #d8e6d8;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-family: inherit;
}

.reply-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-subtle {
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: var(--radius-full);
  padding: 8px 14px;
  cursor: pointer;
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

  .comment-item {
    margin-left: calc(var(--comment-depth) * 10px);
  }
}
</style>
