import { ref, onMounted } from 'vue';
import { blogApi } from '../api/index';

export function useBlog() {
    const posts = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const fetchPosts = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await blogApi.getAll();
            if (response.success) {
                posts.value = response.data;
            }
        } catch (err) {
            error.value = err.message;
            console.error('获取博客列表失败:', err);
        } finally {
            loading.value = false;
        }
    };

    // 自动加载数据
    onMounted(() => {
        fetchPosts();
    });

    return {
        posts,
        loading,
        error,
        fetchPosts,
    };
}