# 工程化配置指南

## 📋 概述

本项目已配置完整的前端工程化工具链，包括代码规范、格式化、Git 提交规范等。

## 🛠️ 工具链

### 1. ESLint - 代码质量检查

**配置文件**: `.eslintrc.cjs`

#### 规则说明

- **TypeScript 规则**
  - `no-explicit-any`: 警告使用 any 类型
  - `no-unused-vars`: 警告未使用的变量（支持 `_` 前缀忽略）
  - `no-non-null-assertion`: 警告使用非空断言

- **Vue 规则**
  - `multi-word-component-names`: 关闭（允许单词组件名）
  - `component-name-in-template-casing`: PascalCase（组件名大驼峰）
  - `custom-event-name-casing`: camelCase（事件名小驼峰）

- **通用规则**
  - `no-console`: 警告（允许 warn 和 error）
  - `no-debugger`: 警告
  - `prefer-const`: 警告
  - `no-var`: 错误
  - `quotes`: 单引号
  - `semi`: 不使用分号

#### 使用命令

```bash
# 检查代码
npm run lint:check

# 自动修复
npm run lint
```

### 2. Prettier - 代码格式化

**配置文件**: `.prettierrc.cjs`

#### 格式规则

- **基础配置**
  - 每行最大长度: 100
  - 缩进: 2 空格
  - 使用单引号
  - 不使用分号
  - 不使用尾随逗号

- **文件特定配置**
  - Vue 文件: 不缩进 script 和 style
  - TypeScript: 使用 TypeScript 解析器
  - JSON: 不使用尾随逗号
  - Markdown: 保留原始换行

#### 使用命令

```bash
# 检查格式
npm run format:check

# 格式化代码
npm run format
```

### 3. Husky - Git Hooks

**配置目录**: `.husky/`

#### Pre-commit Hook

在提交前自动运行 lint-staged，检查和修复暂存的文件。

**文件**: `.husky/pre-commit`

```bash
npx lint-staged
```

#### Commit-msg Hook

在提交时验证 commit message 格式。

**文件**: `.husky/commit-msg`

```bash
npx --no -- commitlint --edit $1
```

### 4. lint-staged - 暂存文件检查

**配置位置**: `package.json` 中的 `lint-staged` 字段

#### 规则

- **JS/TS/Vue 文件**
  1. 运行 ESLint 修复
  2. 运行 Prettier 格式化

- **JSON/MD/CSS 文件**
  1. 运行 Prettier 格式化

### 5. Commitlint - 提交信息规范

**配置文件**: `commitlint.config.cjs`

#### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| Type       | 说明      | 示例                         |
| ---------- | --------- | ---------------------------- |
| `feat`     | 新功能    | `feat: 添加文件上传功能`     |
| `fix`      | 修复 bug  | `fix: 修复文件上传失败问题`  |
| `docs`     | 文档变更  | `docs: 更新 README`          |
| `style`    | 代码格式  | `style: 格式化代码`          |
| `refactor` | 重构      | `refactor: 重构文件上传模块` |
| `perf`     | 性能优化  | `perf: 优化图片加载速度`     |
| `test`     | 测试      | `test: 添加单元测试`         |
| `chore`    | 构建/工具 | `chore: 更新依赖`            |
| `revert`   | 回退      | `revert: 回退上一次提交`     |
| `build`    | 打包      | `build: 优化打包配置`        |

#### 示例

```bash
# ✅ 正确的提交信息
git commit -m "feat: 添加文件上传功能"
git commit -m "fix: 修复路由跳转问题"
git commit -m "docs: 更新工程化配置文档"

# ❌ 错误的提交信息
git commit -m "update"
git commit -m "修复bug"
git commit -m "add feature"
```

## 📝 工作流程

### 1. 开发阶段

```bash
# 启动开发服务器
npm run dev

# 实时 ESLint 检查（IDE 插件）
# 实时 Prettier 格式化（IDE 插件）
```

### 2. 提交前

```bash
# 添加文件到暂存区
git add .

# 提交（会自动触发 pre-commit hook）
git commit -m "feat: 添加新功能"

# pre-commit 会自动：
# 1. 运行 lint-staged
# 2. 对暂存文件执行 ESLint 修复
# 3. 对暂存文件执行 Prettier 格式化
# 4. 如果有错误，提交会被中止
```

### 3. 提交时

```bash
# commit-msg hook 会自动：
# 1. 验证 commit message 格式
# 2. 如果格式不符合规范，提交会被中止
```

### 4. 推送前

```bash
# 手动运行完整检查
npm run lint:check
npm run format:check

# 如果有问题，修复后再推送
npm run lint
npm run format
```

## 🔧 IDE 配置

### VS Code

#### 推荐插件

```json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "vue.volar"]
}
```

#### 设置

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact", "vue"]
}
```

### WebStorm

1. **启用 ESLint**
   - Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - 勾选 "Automatic ESLint configuration"
   - 勾选 "Run eslint --fix on save"

2. **启用 Prettier**
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - 勾选 "On save"
   - 勾选 "On code reformat"

## 📊 配置文件总览

```
.
├── .eslintrc.cjs           # ESLint 配置
├── .eslintignore           # ESLint 忽略文件
├── .prettierrc.cjs         # Prettier 配置
├── .prettierignore         # Prettier 忽略文件
├── commitlint.config.cjs   # Commitlint 配置
├── .husky/                 # Husky hooks
│   ├── pre-commit         # 提交前检查
│   └── commit-msg         # 提交信息验证
└── package.json            # lint-staged 配置
```

## 🎯 最佳实践

### 1. 提交频率

- ✅ 小步提交，每个功能点单独提交
- ✅ 每次提交保持代码可运行
- ❌ 避免一次提交过多改动

### 2. Commit Message

- ✅ 使用规范的 type
- ✅ 简洁明了的描述
- ✅ 必要时添加详细说明
- ❌ 避免模糊的描述

### 3. 代码规范

- ✅ 遵循 ESLint 规则
- ✅ 使用 Prettier 格式化
- ✅ 避免使用 any 类型
- ✅ 及时处理 ESLint 警告

### 4. 团队协作

- ✅ 统一使用相同的工具版本
- ✅ 定期更新依赖
- ✅ 及时同步配置文件
- ✅ Code Review 时关注代码规范

## 🚨 常见问题

### Q1: Pre-commit hook 失败怎么办？

**A**: 查看错误信息，修复 ESLint 或 Prettier 报告的问题：

```bash
# 手动运行检查
npm run lint:check

# 自动修复
npm run lint
npm run format
```

### Q2: Commit message 验证失败？

**A**: 确保提交信息符合规范：

```bash
# 错误示例
git commit -m "update"

# 正确示例
git commit -m "feat: 添加新功能"
```

### Q3: 如何跳过 Git hooks？

**A**: 不推荐，但紧急情况可以使用：

```bash
# 跳过 pre-commit
git commit --no-verify -m "feat: 紧急修复"

# 或使用环境变量
HUSKY=0 git commit -m "feat: 紧急修复"
```

### Q4: ESLint 和 Prettier 冲突？

**A**: 已配置 `eslint-config-prettier` 解决冲突，如果还有问题：

1. 检查 `.eslintrc.cjs` 中是否包含 `'prettier'`
2. 确保 Prettier 规则在最后
3. 重启 IDE

### Q5: 如何禁用某个规则？

**A**: 在文件中使用注释：

```javascript
// 禁用整个文件的规则
/* eslint-disable no-console */

// 禁用下一行的规则
// eslint-disable-next-line no-console
console.log('debug')

// 禁用一段代码的规则
/* eslint-disable no-console */
console.log('debug 1')
console.log('debug 2')
/* eslint-enable no-console */
```

## 📚 参考资源

- [ESLint 官方文档](https://eslint.org/)
- [Prettier 官方文档](https://prettier.io/)
- [Husky 官方文档](https://typicode.github.io/husky/)
- [Commitlint 官方文档](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🎓 总结

通过配置这套工程化工具链，项目获得了：

1. ✅ **代码质量保证** - ESLint 检查代码问题
2. ✅ **统一代码风格** - Prettier 格式化代码
3. ✅ **规范提交信息** - Commitlint 验证提交
4. ✅ **自动化检查** - Husky + lint-staged 自动化
5. ✅ **团队协作** - 统一的代码规范

这些配置帮助团队：

- 减少代码审查时间
- 避免低级错误
- 保持代码一致性
- 提高开发效率

**记住：工具是为了提高效率，而不是增加负担！**
