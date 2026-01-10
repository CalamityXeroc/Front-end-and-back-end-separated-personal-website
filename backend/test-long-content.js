/**
 * 长内容测试脚本
 * 创建一篇包含大量内容的测试博客，用于验证字数限制问题
 * 
 * 使用: node test-long-content.js
 */

const { sequelize } = require('./src/config/database');
const Blog = require('./src/models/Blog');

async function testLongContent() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 生成长内容（模拟真实博客）
    const longContent = `# 长内容测试博客

## 第一部分：基础内容

这是一篇测试博客，用于验证博客编辑系统是否能够正确保存和显示长内容。

### 章节 1.1

Markdown 支持富文本格式，包括：
- **粗体**
- *斜体*
- ~~删除线~~
- \`行内代码\`

### 章节 1.2

这是一个列表示例：
1. 第一项
2. 第二项
3. 第三项

## 第二部分：代码示例

\`\`\`javascript
function testLongContent() {
  const content = 'This is a test blog with long content';
  console.log(content);
  
  // 验证内容长度
  console.log('内容长度:', content.length);
}
\`\`\`

## 第三部分：更多内容

### 3.1 引用示例

> 这是一个引用块
> 可以跨越多行
> 用于强调重要信息

### 3.2 表格示例

| 功能 | 支持 | 说明 |
|------|------|------|
| Markdown | ✅ | 完全支持 |
| 代码高亮 | ✅ | 支持多种语言 |
| 图片 | ✅ | 支持上传和 URL |
| 长内容 | ✅ | 应该不受限制 |

## 第四部分：大量填充内容

${Array(20).fill(null).map((_, i) => `
### 小节 4.${i + 1}

这是第 ${i + 1} 个小节的内容。博客系统应该能够处理任意长度的内容，无论是几千字还是几万字的文章。

这一段是为了填充内容，验证长内容是否能够正确保存到数据库中。在编辑框中看到的内容，保存后应该完全相同，显示页面也应该完整显示所有内容。

如果发现内容被截断，那就说明系统存在字数限制问题，需要修复数据库字段定义或前端逻辑。
`).join('')}

## 结尾

这是内容的结尾部分。如果你看到这行文字在保存后仍然存在，说明长内容保存成功！`;

    console.log(`📝 生成测试内容，长度: ${longContent.length} 字符\n`);

    // 检查是否已存在测试博客
    let testBlog = await Blog.findOne({
      where: { title: '【测试】长内容验证博客' }
    });

    if (testBlog) {
      console.log(`🔄 已存在测试博客，ID: ${testBlog.id}，现在更新内容...\n`);
      await testBlog.update({
        content: longContent,
        updatedAt: new Date()
      });
    } else {
      console.log('📝 创建新的测试博客...\n');
      testBlog = await Blog.create({
        title: '【测试】长内容验证博客',
        content: longContent,
        author: '系统测试',
        tags: ['测试', '长内容验证']
      });
    }

    console.log('✅ 测试博客已保存\n');
    console.log('博客详情：');
    console.log('─'.repeat(80));
    console.log(`ID: ${testBlog.id}`);
    console.log(`标题: ${testBlog.title}`);
    console.log(`内容长度: ${testBlog.content.length} 字符`);
    console.log('─'.repeat(80));
    console.log('\n📋 后续验证步骤：\n');
    console.log(`1. 在浏览器访问: http://localhost:5000/api/blog/${testBlog.id}`);
    console.log(`   查看 API 返回的内容长度是否为 ${testBlog.content.length}`);
    console.log(`\n2. 在编辑器中打开此博客（ID: ${testBlog.id}），查看编辑框内容是否完整`);
    console.log(`\n3. 在博客详情页查看此博客，是否显示所有 ${testBlog.content.length} 个字符\n`);
    console.log('如果所有地方的内容长度都是 ' + testBlog.content.length + ' 字符，说明系统正常！\n');

    // 验证保存的内容
    console.log('🔍 立即验证保存的内容...\n');
    const verification = await Blog.findByPk(testBlog.id);
    if (verification.content.length === longContent.length) {
      console.log(`✅ 验证成功！保存的内容长度正确: ${verification.content.length} 字符`);
    } else {
      console.log(`❌ 验证失败！`);
      console.log(`   期望长度: ${longContent.length}`);
      console.log(`   实际长度: ${verification.content.length}`);
      console.log(`   缺少: ${longContent.length - verification.content.length} 字符`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLongContent();
