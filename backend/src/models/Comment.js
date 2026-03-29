const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联的博客ID'
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '留言者昵称'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    },
    comment: '留言者邮箱'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '留言内容'
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: '父级留言ID，空值表示一级留言'
  },
  likesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '点赞数'
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  tableName: 'Comments'
});

module.exports = Comment;
