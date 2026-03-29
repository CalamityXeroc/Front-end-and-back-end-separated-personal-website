const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

let ensureCompatPromise = null;

function normalizeTableName(table) {
  if (typeof table === 'string') return table;
  if (table && typeof table.tableName === 'string') return table.tableName;
  if (table && typeof table.name === 'string') return table.name;
  return '';
}

async function ensureCommentCompatSchema() {
  if (ensureCompatPromise) {
    return ensureCompatPromise;
  }

  ensureCompatPromise = (async () => {
    const qi = sequelize.getQueryInterface();

    let commentTable;
    try {
      commentTable = await qi.describeTable('Comments');
    } catch (error) {
      commentTable = null;
    }

    if (!commentTable) {
      return;
    }

    if (!commentTable.parentId) {
      await qi.addColumn('Comments', 'parentId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      });
    }

    if (!commentTable.likesCount) {
      await qi.addColumn('Comments', 'likesCount', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    const allTables = await qi.showAllTables();
    const tableNames = new Set(allTables.map((item) => normalizeTableName(item).toLowerCase()));

    if (!tableNames.has('comment_likes')) {
      await qi.createTable('comment_likes', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        commentId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        visitorKey: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });
    }

    await qi.addIndex('Comments', ['blogId', 'createdAt'], {
      name: 'idx_comments_blog_created'
    }).catch(() => {});

    await qi.addIndex('Comments', ['parentId'], {
      name: 'idx_comments_parent'
    }).catch(() => {});

    await qi.addIndex('comment_likes', ['commentId', 'visitorKey'], {
      name: 'uq_comment_likes_comment_visitor',
      unique: true
    }).catch(() => {});

    await qi.addIndex('comment_likes', ['commentId'], {
      name: 'idx_comment_likes_comment'
    }).catch(() => {});

    await sequelize.query(`
      UPDATE "Comments"
      SET "likesCount" = 0
      WHERE "likesCount" IS NULL OR "likesCount" < 0;
    `).catch(() => {});
  })();

  try {
    await ensureCompatPromise;
  } catch (error) {
    ensureCompatPromise = null;
    throw error;
  }
}

function isMissingColumnError(error, columnName) {
  if (!error || !error.message) return false;
  return error.message.includes(`column \"${columnName}\" does not exist`);
}

function isLegacyCommentSchemaError(error) {
  return isMissingColumnError(error, 'parentId') || isMissingColumnError(error, 'likesCount');
}

function normalizeComment(raw) {
  return {
    id: raw.id,
    blogId: Number(raw.blogId),
    nickname: raw.nickname && String(raw.nickname).trim() ? String(raw.nickname) : '访客',
    email: raw.email || '',
    content: raw.content && String(raw.content).trim() ? String(raw.content) : '[无内容]',
    parentId: raw.parentId === undefined ? null : raw.parentId,
    likesCount: Number.isFinite(Number(raw.likesCount)) ? Number(raw.likesCount) : 0,
    createdAt: raw.createdAt || raw.updatedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
  };
}

function buildTree(comments) {
  const map = new Map();
  const roots = [];

  comments.forEach((comment) => {
    map.set(comment.id, {
      ...comment,
      children: []
    });
  });

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function collectDescendantIds(rootId, childrenMap) {
  const ids = [rootId];
  const stack = [rootId];

  while (stack.length) {
    const current = stack.pop();
    const children = childrenMap.get(current) || [];
    children.forEach((childId) => {
      ids.push(childId);
      stack.push(childId);
    });
  }

  return ids;
}

function getVisitorKey(req) {
  const bodyVisitorKey = req.body && typeof req.body.visitorKey === 'string' ? req.body.visitorKey.trim() : '';
  const queryVisitorKey = req.query && typeof req.query.visitorKey === 'string' ? req.query.visitorKey.trim() : '';
  return bodyVisitorKey || queryVisitorKey || '';
}

// 获取指定博客的所有留言
exports.getCommentsByBlogId = async (req, res) => {
  try {
    await ensureCommentCompatSchema();

    const blogId = parseInt(req.params.blogId, 10);
    if (Number.isNaN(blogId)) {
      return res.status(400).json({ success: false, message: '无效的 blogId' });
    }

    const treeMode = String(req.query.tree || '').toLowerCase() === 'true';
    const visitorKey = getVisitorKey(req);

    const commentsRaw = await Comment.findAll({
      where: { blogId },
      order: [['createdAt', 'ASC']]
    });

    const comments = commentsRaw.map((item) => normalizeComment(item.toJSON()));

    let likedCommentIds = new Set();
    if (visitorKey) {
      const likes = await CommentLike.findAll({
        where: { visitorKey },
        attributes: ['commentId']
      });
      likedCommentIds = new Set(likes.map((item) => Number(item.commentId)));
    }

    const commentsWithLikeState = comments.map((item) => ({
      ...item,
      likedByCurrentVisitor: likedCommentIds.has(Number(item.id))
    }));

    const data = treeMode ? buildTree(commentsWithLikeState) : commentsWithLikeState.reverse();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取留言失败:', error);
    res.status(500).json({
      success: false,
      message: '获取留言失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 验证 email 简单函数
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // 简单的正则校验，避免 Sequelize 抛错导致无法定位原因
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// 创建新留言
exports.createComment = async (req, res) => {
  try {
    await ensureCommentCompatSchema();

    let { blogId, nickname, email, content, parentId } = req.body;

    // 基本校验
    blogId = parseInt(blogId, 10);
    if (Number.isNaN(blogId) || !nickname || !email || !content) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必填的，且 blogId 必须为数字'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }

    const normalizedParentId = parentId === null || parentId === undefined || parentId === '' ? null : parseInt(parentId, 10);
    if (normalizedParentId !== null && Number.isNaN(normalizedParentId)) {
      return res.status(400).json({
        success: false,
        message: 'parentId 必须为数字或空值'
      });
    }

    if (normalizedParentId !== null) {
      const parent = await Comment.findByPk(normalizedParentId);
      if (!parent || Number(parent.blogId) !== blogId) {
        return res.status(400).json({
          success: false,
          message: '父评论不存在或不属于该博客'
        });
      }
    }

    // 创建留言
    const newComment = await Comment.create({
      blogId,
      nickname: String(nickname).trim(),
      email: String(email).trim(),
      content: String(content).trim(),
      parentId: normalizedParentId,
      likesCount: 0
    });

    res.status(201).json({
      success: true,
      data: normalizeComment(newComment.toJSON()),
      message: '留言发布成功'
    });
  } catch (error) {
    if (isLegacyCommentSchemaError(error)) {
      try {
        let { blogId, nickname, email, content } = req.body;
        blogId = parseInt(blogId, 10);

        const [rows] = await sequelize.query(
          `
            INSERT INTO "Comments" ("blogId", "nickname", "email", "content", "createdAt", "updatedAt")
            VALUES (:blogId, :nickname, :email, :content, NOW(), NOW())
            RETURNING *
          `,
          {
            replacements: {
              blogId,
              nickname: String(nickname || '').trim() || '访客',
              email: String(email || '').trim(),
              content: String(content || '').trim() || '[无内容]'
            }
          }
        );

        return res.status(201).json({
          success: true,
          data: normalizeComment(rows[0] || {}),
          message: '留言发布成功'
        });
      } catch (legacyError) {
        console.error('兼容模式发布留言失败:', legacyError);
      }
    }

    console.error('发布留言失败:', error);
    // 如果是 Sequelize 验证错误，返回友好错误信息
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: error.errors && error.errors.length ? error.errors[0].message : '数据验证失败'
      });
    }

    res.status(500).json({
      success: false,
      message: '发布留言失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 点赞留言（同一访客不可重复点赞）
exports.likeComment = async (req, res) => {
  try {
    await ensureCommentCompatSchema();

    const commentId = parseInt(req.params.id, 10);
    if (Number.isNaN(commentId)) {
      return res.status(400).json({ success: false, message: '无效的 commentId' });
    }

    const visitorKey = getVisitorKey(req);
    if (!visitorKey) {
      return res.status(400).json({ success: false, message: '缺少访客标识 visitorKey' });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    const [like, created] = await CommentLike.findOrCreate({
      where: { commentId, visitorKey },
      defaults: { commentId, visitorKey }
    });

    if (!created) {
      return res.status(200).json({
        success: true,
        data: {
          commentId,
          likesCount: Number(comment.likesCount || 0),
          likedByCurrentVisitor: true
        },
        message: '你已经点过赞了'
      });
    }

    await comment.increment('likesCount', { by: 1 });
    await comment.reload();

    res.status(201).json({
      success: true,
      data: {
        commentId,
        likesCount: Number(comment.likesCount || 0),
        likedByCurrentVisitor: true
      },
      message: '点赞成功'
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除留言
exports.deleteComment = async (req, res) => {
  try {
    await ensureCommentCompatSchema();

    const commentId = parseInt(req.params.id, 10);
    if (Number.isNaN(commentId)) {
      return res.status(400).json({ success: false, message: '无效的 commentId' });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    const allComments = await Comment.findAll({
      attributes: ['id', 'parentId']
    });

    const childrenMap = new Map();
    allComments.forEach((item) => {
      const parent = item.parentId;
      if (!parent) return;
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent).push(item.id);
    });

    const idsToDelete = collectDescendantIds(commentId, childrenMap);

    await CommentLike.destroy({
      where: { commentId: idsToDelete }
    });

    await Comment.destroy({
      where: { id: idsToDelete }
    });

    res.json({
      success: true,
      message: '留言删除成功',
      data: {
        deletedIds: idsToDelete
      }
    });
  } catch (error) {
    console.error('删除留言失败:', error);
    res.status(500).json({
      success: false,
      message: '删除留言失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
