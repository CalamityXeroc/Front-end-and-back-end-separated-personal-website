/**
 * 博客内容完整性验证脚本
 * 用于检查数据库中存储的博客内容是否完整
 * 
 * 使用: node verify-blog-content.js [blog-id]
 * 如果不提供 blog-id，会列出所有博客
 */

const { sequelize } = require('./src/config/database');
const Blog = require('./src/models/Blog');

async function verifyBlogContent() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    const blogId = process.argv[2];

    if (blogId) {
      // 查询指定 ID 的博客
      const blog = await Blog.findByPk(blogId);
      if (!blog) {
        console.log(`❌ 博客 ID ${blogId} 不存在`);
        process.exit(1);
      }

      console.log('📖 博客详情：');
      console.log('─'.repeat(80));
      console.log(`ID: ${blog.id}`);
      console.log(`标题: ${blog.title}`);
      console.log(`作者: ${blog.author}`);
      console.log(`创建时间: ${blog.createdAt}`);
      console.log(`更新时间: ${blog.updatedAt}`);
      console.log(`标签: ${blog.tags?.join(', ') || '(无)'}`);
      console.log('─'.repeat(80));
      console.log(`内容长度: ${blog.content.length} 字符`);
      console.log('─'.repeat(80));
      console.log('📝 内容预览（前 500 字符）：');
      console.log(blog.content.substring(0, 500));
      if (blog.content.length > 500) {
        console.log('\n... (内容继续) ...\n');
        console.log('📝 内容结尾（最后 500 字符）：');
        console.log(blog.content.substring(blog.content.length - 500));
      }
      console.log('\n' + '─'.repeat(80));
      console.log(`✅ 博客内容完整，共 ${blog.content.length} 字符`);
    } else {
      // 列出所有博客摘要
      const blogs = await Blog.findAll({
        attributes: ['id', 'title', 'author', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']],
        raw: true
      });

      if (blogs.length === 0) {
        console.log('📭 数据库中没有博客');
        process.exit(0);
      }

      console.log(`📚 总共 ${blogs.length} 篇博客：\n`);
      
      // 获取每篇博客的内容长度
      const blogsWithContentLength = await Promise.all(
        blogs.map(async (blog) => {
          const fullBlog = await Blog.findByPk(blog.id);
          return {
            ...blog,
            contentLength: fullBlog.content.length
          };
        })
      );

      // 制作表格
      const table = blogsWithContentLength.map(blog => ({
        'ID': blog.id,
        '标题': blog.title.substring(0, 30) + (blog.title.length > 30 ? '...' : ''),
        '作者': blog.author,
        '内容字数': blog.contentLength,
        '创建时间': blog.createdAt.toLocaleString('zh-CN')
      }));

      console.table(table);
      console.log('\n提示：使用 node verify-blog-content.js [blog-id] 查看完整内容');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

verifyBlogContent();
