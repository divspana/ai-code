module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 类型定义
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档变更
        'style',    // 代码格式（不影响代码运行）
        'refactor', // 重构（既不是新增功能，也不是修复 bug）
        'perf',     // 性能优化
        'test',     // 增加测试
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回退
        'build'     // 打包
      ]
    ],
    // Subject 大小写不做校验
    'subject-case': [0],
    // Subject 不允许为空
    'subject-empty': [2, 'never'],
    // Type 不允许为空
    'type-empty': [2, 'never']
  }
}
