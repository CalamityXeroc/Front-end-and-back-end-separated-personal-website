# GitHub 上传指南

## 📦 准备上传到 GitHub 的内容

### ✅ 需要上传的文件

**前端部分：**
- `src/` - 所有源代码
- `public/` - 公共资源（图片、视频等）
- `index.html` - 入口HTML
- `package.json` - 依赖配置
- `vite.config.js` - Vite配置
- `jsconfig.json` - JS配置
- `README.md` - 项目文档
- `LICENSE` - 开源协议

**后端部分：**
- `backend/src/` - 所有源代码
- `backend/package.json` - 依赖配置
- `backend/.env.example` - 环境变量模板
- `backend/README.md` - 后端文档
- `backend/.gitignore` - 后端忽略文件

**项目配置：**
- `.gitignore` - Git忽略规则
- `SECURITY.md` - 安全说明

### ❌ 不上传的文件（已在 .gitignore 中）

- `node_modules/` - 依赖包（过大，用户自行安装）
- `dist/` - 构建产物（用户自行构建）
- `backend/.env` - 环境变量（包含敏感信息）
- `backend/uploads/` - 用户上传文件
- `*.sql` - 数据库备份文件
- `*.log` - 日志文件
- 部署脚本（`deploy-fixed.ps1` 等）

## 🚀 上传步骤

### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 提交到本地仓库

```bash
git commit -m "Initial commit: Personal website with blog system"
```

### 4. 在 GitHub 创建新仓库

1. 访问 [GitHub](https://github.com/)
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `my-personal-website`
   - Description: `个人网站 - 基于Vue3+Node.js的全栈博客系统`
   - Public/Private: 选择 Public（开源）
   - 不要勾选 "Initialize this repository with a README"

### 5. 关联远程仓库

```bash
git remote add origin https://github.com/你的用户名/my-personal-website.git
```

### 6. 推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

## 🔐 安全注意事项

### 已经被 .gitignore 排除的敏感文件：

✅ `backend/.env` - 数据库密码等敏感配置  
✅ `backend/uploads/` - 用户上传的文件  
✅ `deploy-fixed.ps1` - 包含服务器信息的部署脚本  
✅ `*.sql` - 数据库备份文件  

### 上传前检查清单：

- [ ] 确认 `.env` 文件未被提交
- [ ] 确认没有硬编码的密码或密钥
- [ ] 确认 README.md 中的联系方式是否愿意公开
- [ ] 确认个人照片和敏感图片已移除或替换

## 📝 提交信息建议

**初次提交：**
```bash
git commit -m "Initial commit: Personal website with blog system"
```

**后续提交示例：**
```bash
git commit -m "feat: Add mobile responsive design"
git commit -m "fix: Fix blog post rendering issue"
git commit -m "docs: Update README with deployment guide"
```

## 🎯 完成后的效果

你的 GitHub 仓库将包含：
- 完整的源代码
- 详细的 README 文档
- 清晰的项目结构
- MIT 开源协议
- 后端 API 文档

用户可以：
- Fork 你的项目
- 克隆到本地运行
- 参考你的代码学习
- 提交 Issue 和 PR

## 🔄 后续更新

当你在本地修改代码后，使用以下命令同步到 GitHub：

```bash
# 查看修改状态
git status

# 添加修改
git add .

# 提交
git commit -m "你的提交信息"

# 推送
git push
```

## 📞 需要帮助？

如果在上传过程中遇到问题：
1. 检查 `.gitignore` 文件是否正确
2. 确认 Git 远程仓库地址是否正确
3. 查看 Git 错误信息并搜索解决方案

---

准备好了吗？开始上传你的项目吧！ 🚀
