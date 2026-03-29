const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentLike = sequelize.define('CommentLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '留言ID'
  },
  visitorKey: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '访客唯一标识（匿名场景去重）'
  }
}, {
  tableName: 'comment_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['commentId', 'visitorKey']
    },
    {
      fields: ['commentId']
    }
  ]
});

module.exports = CommentLike;
