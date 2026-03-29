const { sequelize } = require('../config/database');

async function migrateCommentsCompat() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 开始执行评论兼容迁移...');

    // 1) 扩展旧评论表字段（可重复执行）
    await sequelize.query(`
      ALTER TABLE "Comments"
      ADD COLUMN IF NOT EXISTS "parentId" INTEGER NULL;
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE "Comments"
      ADD COLUMN IF NOT EXISTS "likesCount" INTEGER NOT NULL DEFAULT 0;
    `, { transaction });

    // 2) 修复历史空值/异常值
    await sequelize.query(`
      UPDATE "Comments"
      SET "nickname" = '访客'
      WHERE "nickname" IS NULL OR BTRIM("nickname") = '';
    `, { transaction });

    await sequelize.query(`
      UPDATE "Comments"
      SET "content" = '[无内容]'
      WHERE "content" IS NULL OR BTRIM("content") = '';
    `, { transaction });

    await sequelize.query(`
      UPDATE "Comments"
      SET "likesCount" = 0
      WHERE "likesCount" IS NULL OR "likesCount" < 0;
    `, { transaction });

    // 3) 建立点赞关系表（匿名访客去重）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comment_likes" (
        "id" SERIAL PRIMARY KEY,
        "commentId" INTEGER NOT NULL,
        "visitorKey" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("commentId", "visitorKey")
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_comments_blog_created"
      ON "Comments" ("blogId", "createdAt");
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_comments_parent"
      ON "Comments" ("parentId");
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_comment_likes_comment"
      ON "comment_likes" ("commentId");
    `, { transaction });

    await transaction.commit();
    console.log('✅ 评论兼容迁移执行完成');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ 评论兼容迁移失败:', error);
    process.exit(1);
  }
}

migrateCommentsCompat();
