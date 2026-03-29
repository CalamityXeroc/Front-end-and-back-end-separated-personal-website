# 🗄️ 数据库字段迁移 - 快速操作指南

**目的：** 为 Comments 表添加新字段（parentId, likesCount）和创建 CommentLike 表  
**时间：** 5-10 分钟  
**风险：** 极低（脚本幂等，可重复运行）

---

## ⚡ 快速方案（推荐）

### 方案 A：运行自动迁移脚本（1 分钟）

在服务器上执行：

```bash
cd /www/wwwroot/your-project/backend
npm run migrate-comments
```

**输出应该显示：**
```
✅ 数据库迁移完成
✅ 已添加 parentId 字段
✅ 已添加 likesCount 字段
✅ 已创建 comment_likes 表
✅ 已创建必要的索引
```

**验证成功：**
```bash
psql -h localhost -U postgres -d my_website -c "\d comments"
# 应该能看到：
#  parentId       | integer
#  likesCount     | integer
```

---

## 🛡️ 保险方案（推荐给有重要数据的用户）

### 方案 B：先备份再迁移（3 分钟）

```bash
# 1. 备份当前数据库
pg_dump -h localhost -U postgres -d my_website > ~/backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. 运行迁移脚本
cd /www/wwwroot/your-project/backend
npm run migrate-comments

# 3. 验证成功
psql -h localhost -U postgres -d my_website -c "SELECT COUNT(*) FROM comments;"
# 应该显示评论总数（无变化）

# 4. 如果需要恢复（极少情况）
# psql -h localhost -U postgres -d my_website < ~/backup_before_migration_xxx.sql
```

---

## 🎯 手动方案（完全可控）

### 方案 C：用 SQL 命令手动操作（5 分钟）

```bash
# 1. 连接到数据库
psql -h localhost -U postgres -d my_website
```

然后粘贴这些 SQL 命令：

```sql
-- ============================================
-- 第 1 步：给 Comments 表添加新字段
-- ============================================

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS "parentId" INTEGER;

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS "likesCount" INTEGER DEFAULT 0;

-- 为 parentId 添加外键约束（自引用）
ALTER TABLE comments 
ADD CONSTRAINT IF NOT EXISTS fk_comment_parent 
FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE CASCADE;

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments("parentId");
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments("blogId");

-- ============================================
-- 第 2 步：创建 CommentLike 表（点赞记录）
-- ============================================

CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" SERIAL PRIMARY KEY,
  "commentId" INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  "visitorKey" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("commentId", "visitorKey")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON "comment_likes"("commentId");
CREATE INDEX IF NOT EXISTS idx_comment_likes_visitor_key ON "comment_likes"("visitorKey");

-- ============================================
-- 第 3 步：修复历史数据
-- ============================================

-- 把 NULL 的 likesCount 改成 0
UPDATE comments 
SET "likesCount" = 0 
WHERE "likesCount" IS NULL;

-- ============================================
-- 第 4 步：验证迁移成功
-- ============================================

-- 查看 Comments 表结构
\d comments

-- 查看 CommentLike 表结构
\d comment_likes

-- 查看是否有数据
SELECT COUNT(*) as total_comments FROM comments;
SELECT COUNT(*) as total_likes FROM comment_likes;

-- 退出
\q
```

---

## ✅ 迁移后的验证

**无论用哪个方案，都要验证：**

```bash
# 1. 检查 Comments 表
psql -h localhost -U postgres -d my_website -c "SELECT id, blogId, parentId, likesCount FROM comments LIMIT 5;"
# 应该能看到 parentId 和 likesCount 两列

# 2. 检查 CommentLike 表是否创建
psql -h localhost -U postgres -d my_website -c "\d comment_likes"
# 应该显示表结构

# 3. 重启后端确保连接新字段
# 通过宝塔面板或命令行重启 Node.js
```

---

## 🆘 如果出错

### 错误 1：字段已存在
```
Error: column "parentId" already exists
```
**不用理，脚本用了 `IF NOT EXISTS`，说明字段已经在了**

### 错误 2：外键冲突
```
Error: insert or update on table violates foreign key constraint
```
**解决：**
```sql
-- 删除约束后重新添加
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comment_parent;
ALTER TABLE comments ADD CONSTRAINT fk_comment_parent 
  FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE CASCADE;
```

### 错误 3：迁移脚本找不到
```
npm run migrate-comments 
# Command not found
```
**解决：检查 package.json 是否有 migrate-comments 脚本**
```bash
cat package.json | grep migrate-comments
```

如果没有，手动用方案 C（SQL 命令）

---

## 📋 迁移后的功能

迁移完成后，系统支持：

| 功能 | 依赖字段 | 说明 |
|------|--------|------|
| 树形评论（回复） | parentId | null = 一级评论，有值 = 回复某条评论 |
| 点赞计数 | likesCount | 显示每条评论的总点赞数 |
| 去重点赞 | comment_likes 表 | 记录 visitorKey，防止重复点赞 |
| 级联删除 | 外键约束 | 删除评论时自动删除回复和点赞记录 |

---

## 🎯 推荐操作流程

**最安全的做法：**

```bash
# 1. 登录宝塔 → SSH 终端

# 2. 备份（可选但推荐）
pg_dump -h localhost -U postgres -d my_website > ~/backup_$(date +%s).sql

# 3. 运行迁移（一条命令）
cd /www/wwwroot/your-project/backend && npm run migrate-comments

# 4. 验证（看看有没有错误）
psql -h localhost -U postgres -d my_website -c "\d comments"

# 5. 重启后端
# 宝塔面板 → Node.js → 项目 → 重启
```

---

## 💡 常用命令速查

```bash
# 检查 Comments 表的所有字段
psql -h localhost -U postgres -d my_website -c "\d comments"

# 查看所有评论（包括新字段）
psql -h localhost -U postgres -d my_website -c "SELECT * FROM comments LIMIT 10;"

# 查看某条评论的所有回复（树形查询）
psql -h localhost -U postgres -d my_website -c "SELECT id, content, \"parentId\" FROM comments WHERE \"parentId\" = 1;"

# 查看某条评论的所有点赞记录
psql -h localhost -U postgres -d my_website -c "SELECT * FROM comment_likes WHERE \"commentId\" = 1;"

# 统计数据
psql -h localhost -U postgres -d my_website -c "SELECT COUNT(*) as comments, SUM(\"likesCount\") as total_likes FROM comments;"
```

---

**建议：** 用**方案 A**（自动脚本），最简单最安全！ ✅
