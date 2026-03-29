const { sequelize } = require('./database');
const Blog = require('../models/Blog');
const MapMarker = require('../models/MapMarker');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');

async function initDatabase() {
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步所有模型（创建表）
    await sequelize.sync({ force: false }); // force: true 会删除已有表重新创建
    console.log('✅ 数据库表创建/同步成功');
    
    // 检查是否有数据
    const blogCount = await Blog.count();
    const commentCount = await Comment.count();
    const likeCount = await CommentLike.count();
    
    console.log(`\n📊 当前数据统计:`);
    console.log(`   博客: ${blogCount} 篇`);
    console.log(`   评论: ${commentCount} 条`);
    console.log(`   点赞: ${likeCount} 条`);
    
    // 如果没有数据，插入示例数据
    if (blogCount === 0) {
      console.log('\n📝 插入示例博客数据...');
      await Blog.bulkCreate([
        {
          title: '我的第一篇博客',
          content: '# 欢迎\n\n这是我的第一篇博客文章！',
          author: '佰世铜',
          tags: ['开始', '日记'],
          coverImage: '/uploads/default-blog.jpg'
        },
        {
          title: 'WebGIS 学习笔记',
          content: '今天学习了 OpenLayers 的基础用法...',
          author: '佰世铜',
          tags: ['技术', 'WebGIS'],
          coverImage: '/uploads/webgis.jpg'
        }
      ]);
      console.log('✅ 示例博客数据插入成功');
    }
    
    console.log('\n✨ 数据库初始化完成！\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
