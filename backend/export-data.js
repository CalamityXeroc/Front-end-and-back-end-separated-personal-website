const { sequelize } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function exportData() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
    
    // 查询所有博客数据
    const [blogs] = await sequelize.query('SELECT * FROM blogs ORDER BY id');
    console.log(`找到 ${blogs.length} 篇博客`);
    
    // 查询所有评论数据（如果表存在）
    let comments = [];
    try {
      const [result] = await sequelize.query('SELECT * FROM comments ORDER BY id');
      comments = result;
      console.log(`找到 ${comments.length} 条评论`);
    } catch (err) {
      console.log('comments 表不存在，跳过评论数据');
    }
    
    // 生成 SQL 插入语句
    let sql = '-- 博客数据导出\n\n';
    
    if (blogs.length > 0) {
      sql += '-- 插入博客数据\n';
      blogs.forEach(blog => {
        const title = blog.title ? String(blog.title).replace(/'/g, "''") : '';
        const content = blog.content ? String(blog.content).replace(/'/g, "''") : '';
        const coverImage = blog.cover_image ? String(blog.cover_image).replace(/'/g, "''") : '';
        
        // 转换时间为 ISO 格式
        let createdAt = new Date().toISOString();
        if (blog.created_at || blog.createdAt) {
          const date = new Date(blog.created_at || blog.createdAt);
          createdAt = date.toISOString();
        }
        
        let updatedAt = new Date().toISOString();
        if (blog.updated_at || blog.updatedAt) {
          const date = new Date(blog.updated_at || blog.updatedAt);
          updatedAt = date.toISOString();
        }
        
        // tags 是数组类型，需要特殊处理
        let tagsArray = '{}';
        if (blog.tags) {
          if (Array.isArray(blog.tags)) {
            const escapedTags = blog.tags.map(tag => `"${String(tag).replace(/"/g, '\\"')}"`).join(',');
            tagsArray = `{${escapedTags}}`;
          } else if (typeof blog.tags === 'string') {
            const tags = blog.tags.split(',').map(t => t.trim());
            const escapedTags = tags.map(tag => `"${tag.replace(/"/g, '\\"')}"`).join(',');
            tagsArray = `{${escapedTags}}`;
          }
        }
        
        sql += `INSERT INTO blogs (title, content, cover_image, tags, created_at, updated_at) VALUES ('${title}', '${content}', '${coverImage}', '${tagsArray}', '${createdAt}', '${updatedAt}');\n`;
      });
      sql += '\n';
    }
    
    if (comments.length > 0) {
      sql += '-- 插入评论数据\n';
      comments.forEach(comment => {
        const content = comment.content ? comment.content.replace(/'/g, "''") : '';
        const author = comment.author ? comment.author.replace(/'/g, "''") : '';
        const email = comment.email ? comment.email.replace(/'/g, "''") : '';
        const blogId = comment.blog_id || comment.blogId;
        const createdAt = comment.created_at || comment.createdAt || new Date().toISOString();
        
        sql += `INSERT INTO comments (blog_id, content, author, email, created_at) VALUES (${blogId}, '${content}', '${author}', '${email}', '${createdAt}');\n`;
      });
    }
    
    // 保存到文件
    const filePath = path.join(__dirname, 'blog_data.sql');
    fs.writeFileSync(filePath, sql, 'utf8');
    console.log(`\n✅ 数据已导出到: ${filePath}`);
    console.log('\n📤 请将此文件上传到服务器，然后在服务器上运行：');
    console.log('psql -h localhost -p 5433 -U 123456 -d blog -f blog_data.sql');
    
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

exportData();
