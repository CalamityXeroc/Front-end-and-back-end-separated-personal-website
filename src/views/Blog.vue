<template>
  <div class="blog">
    <h1>我的博客</h1>
    <div class="blog-list">
      <BlogCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>

<script>
import BlogCard from '../components/BlogCard.vue';
import { ref } from 'vue';
import { useBlog } from '../composables/useBlog';

export default {
  name: 'Blog',
  components: {
    BlogCard,
  },
  setup() {
    const { posts } = useBlog();
    return { posts };
  },
};
</script>

<style scoped>
.blog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 24px 56px;
}

.blog h1 {
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
}

.blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
  padding: 0;
}

@media (max-width: 767px) {
  .blog {
    padding: 20px 12px 36px;
  }

  .blog-list {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}
</style>