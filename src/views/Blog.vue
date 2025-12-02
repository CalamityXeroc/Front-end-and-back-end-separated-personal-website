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
  padding: 20px;
}

.blog-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
</style>