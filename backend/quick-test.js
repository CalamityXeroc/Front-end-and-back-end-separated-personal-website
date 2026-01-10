/**
 * 快速测试脚本 - 直接查看某篇博客的完整内容
 * 使用: node quick-test.js [blog-id]
 */

const { sequelize } = require('./src/config/database');
const Blog = require('./src/models/Blog');

async function quickTest() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    const blogId = process.argv[2] || 1;
    
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      console.log(`❌ 博客 ID ${blogId} 不存在\n`);
      
      // 列出所有博客
      const allBlogs = await Blog.findAll({ 
        attributes: ['id', 'title'],
        order: [['id', 'DESC']]
      });
      
      if (allBlogs.length > 0) {
        console.log('📚 可用的博客：');
        allBlogs.forEach(b => console.log(`   ID: ${b.id} - ${b.title}`));
      }
      process.exit(1);
    }

    console.log(`📖 博客: ${blog.title}`);
    console.log(`📏 内容长度: ${blog.content.length} 字符\n`);
    console.log('内容预览：');
    console.log('─'.repeat(80));
    console.log(blog.content.substring(0, 300));
    console.log('...');
    console.log('─'.repeat(80));
    console.log('\n✅ 数据库中的完整内容长度为: ' + blog.content.length);

    await sequelize.close();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

quickTest();
