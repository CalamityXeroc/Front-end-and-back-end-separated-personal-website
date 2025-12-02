import { createStore } from 'vuex';

const store = createStore({
  state: {
    blogs: [],
    gallery: [],
    maps: []
  },
  mutations: {
    setBlogs(state, blogs) {
      state.blogs = blogs;
    },
    addBlog(state, blog) {
      state.blogs.push(blog);
    },
    setGallery(state, photos) {
      state.gallery = photos;
    },
    addPhoto(state, photo) {
      state.gallery.push(photo);
    },
    setMaps(state, maps) {
      state.maps = maps;
    },
    addMap(state, map) {
      state.maps.push(map);
    }
  },
  actions: {
    fetchBlogs({ commit }) {
      // Fetch blogs from an API or other source
      // commit('setBlogs', fetchedBlogs);
    },
    fetchGallery({ commit }) {
      // Fetch gallery photos from an API or other source
      // commit('setGallery', fetchedPhotos);
    },
    fetchMaps({ commit }) {
      // Fetch maps from an API or other source
      // commit('setMaps', fetchedMaps);
    }
  },
  getters: {
    allBlogs: (state) => state.blogs,
    allPhotos: (state) => state.gallery,
    allMaps: (state) => state.maps
  }
});

export default store;