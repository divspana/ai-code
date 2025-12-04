#!/bin/bash

# 批量将 Vue 文件中的 <style scoped> 改为 <style scoped lang="scss">

echo "开始转换 Vue 文件样式为 SCSS..."

# 查找所有 .vue 文件并替换
find src -name "*.vue" -type f | while read file; do
  # 检查文件是否包含 <style scoped> 但不包含 lang="scss"
  if grep -q '<style scoped>' "$file" && ! grep -q 'lang="scss"' "$file"; then
    # 执行替换
    sed -i '' 's/<style scoped>/<style scoped lang="scss">/g' "$file"
    echo "✅ 已转换: $file"
  fi
  
  # 也处理没有 scoped 的情况
  if grep -q '<style>' "$file" && ! grep -q 'lang="scss"' "$file" && ! grep -q 'scoped' "$file"; then
    sed -i '' 's/<style>/<style lang="scss">/g' "$file"
    echo "✅ 已转换: $file"
  fi
done

echo ""
echo "🎉 转换完成！"
echo ""
echo "统计信息:"
echo "- 包含 SCSS 的文件数: $(grep -r 'lang="scss"' src --include="*.vue" | wc -l)"
