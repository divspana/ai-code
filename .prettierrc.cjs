module.exports = {
  // 基础配置
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // 换行符
  endOfLine: 'lf',
  
  // Vue 文件配置
  vueIndentScriptAndStyle: false,
  
  // HTML 空格敏感度
  htmlWhitespaceSensitivity: 'css',
  
  // 文件覆盖配置
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript'
      }
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'preserve'
      }
    }
  ]
}
