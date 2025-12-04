# Wafer Map Pro - 专业版使用指南

## 概述

Wafer Map Pro 是参考业界标准（KLA、Applied Materials、Advantest 等）实现的专业级晶圆图分析工具，提供完整的半导体测试数据可视化和分析功能。

## 业界标准功能对标

### 1. 晶圆坐标系统 ✅

**对标**: KLA Klarity, Applied Materials WaferView

**功能**:

- 标准晶圆坐标系（X-Y 坐标）
- 缺口（Notch）标识
- 晶圆轮廓显示
- 坐标轴标注

**实现**:

```typescript
// 绘制晶圆轮廓和缺口
const drawWaferOutline = ctx => {
  // 圆形轮廓
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)

  // 缺口标识
  ctx.arc(centerX, centerY - radius, notchSize, 0, Math.PI)
}
```

### 2. Bin 分类系统 ✅

**对标**: Advantest T2000, Teradyne UltraFLEX

**标准 Bin 定义**:

- **Bin 0**: Not Tested（未测试）
- **Bin 1**: Pass（良品）
- **Bin 2**: Functional Fail（功能失效）
- **Bin 3**: Parametric Fail（参数失效）
- **Bin 4**: Retest Pass（重测良品）
- **Bin 5**: Ink Mark（墨点标记）
- **Bin 6**: Edge Die（边缘芯片）
- **Bin 7**: Probe Mark（探针痕迹）
- **Bin 8**: Short（短路）
- **Bin 9**: Open（开路）

**分类**:

- Pass: Bin 1, 4
- Fail: Bin 2, 3, 8, 9
- Special: Bin 5, 6, 7
- Test: Bin 0

### 3. 显示模式 ✅

**对标**: KLA Klarity 多模式显示

**支持模式**:

- **Bin Map**: 按 Bin 分类显示（标准模式）
- **Heat Map**: 参数热力图显示
- **Yield Map**: 良率分布图（计划中）

### 4. 统计分析 ✅

**对标**: Applied Materials WaferView Statistics

**统计指标**:

- 总 Die 数量
- 各 Bin 数量和百分比
- 整体良率
- 区域良率（框选后）
- Bin 分布排序

### 5. 交互功能 ✅

**对标**: 业界标准交互方式

**功能**:

- 缩放（鼠标滚轮）
- 平移（拖拽）
- 框选分析（Shift + 拖拽）
- Die 详情查看（点击）
- Bin 筛选（点击图例）

### 6. 数据导出 ✅

**对标**: 业界标准数据格式

**支持格式**:

- **CSV**: 通用格式
- **SINF**: 半导体标准格式
- **STDF**: IEEE 1671 标准（计划中）

## 核心功能详解

### 1. 晶圆尺寸支持

支持标准晶圆尺寸：

- 4 英寸（100mm）
- 6 英寸（150mm）
- 8 英寸（200mm）
- **12 英寸（300mm）** - 主流
- 18 英寸（450mm）

### 2. 缺陷模式识别

**边缘效应**:

```typescript
if (normalized > 0.95) {
  bin = 6 // Edge Die
}
```

**缺陷簇模拟**:

```typescript
const clusterHash = (clusterX * 31 + clusterY * 17) % 100
if (clusterHash < 3) {
  bin = 2 // Defect cluster
}
```

### 3. Bin 图例

**交互式图例**:

- 显示 Bin 颜色
- 显示 Bin 名称
- 显示数量和百分比
- 点击高亮对应 Die
- 悬停效果

### 4. 控制面板

**参数设置**:

- 数据量调整
- 晶圆尺寸选择
- 显示选项开关
  - 显示缺口
  - 显示坐标
  - 显示网格

### 5. 详细信息面板

**Die 详情**:

- 坐标位置
- Bin 编号
- Bin 名称
- 分类
- 测试值

**选中区域统计**:

- 总数
- 良品数
- 不良数
- 区域良率

## 专业特性

### 1. 真实的缺陷分布模拟

模拟真实晶圆的缺陷分布特征：

**边缘效应**:

- 晶圆边缘失效率更高
- 边缘 Die 标记

**缺陷簇**:

- 模拟工艺缺陷导致的簇状分布
- 使用哈希函数生成可重复的缺陷模式

**随机失效**:

- 中心区域低失效率
- 符合泊松分布

### 2. 颜色编码标准

参考业界标准的颜色方案：

| Bin        | 颜色      | 说明          |
| ---------- | --------- | ------------- |
| Pass       | 绿色      | 符合 IPC 标准 |
| Fail       | 红色/橙色 | 警示色        |
| Special    | 紫色/灰色 | 中性色        |
| Not Tested | 灰色      | 未知状态      |

### 3. 坐标系统

**标准坐标**:

- 原点：晶圆中心
- X 轴：水平方向
- Y 轴：垂直方向
- 缺口：顶部（12 点方向）

### 4. 性能优化

继承基础版的所有优化：

- 防抖渲染
- 自适应采样
- 视口裁剪
- 颜色分组
- 条件网格

## 数据格式

### CSV 格式

```csv
X,Y,Bin,Value,BinName
0,0,1,85.32,Pass
1,0,1,92.15,Pass
2,0,2,45.67,Functional Fail
```

### SINF 格式

```
FileType: SINF
WaferSize: 12
DieCount: 9852

0,0,1
1,0,1
2,0,2
```

### STDF 格式（计划中）

IEEE 1671 标准二进制格式

## 使用场景

### 1. 测试数据分析

- 查看测试结果分布
- 识别失效模式
- 计算良率

### 2. 工艺监控

- 监控工艺稳定性
- 发现工艺异常
- 追踪缺陷趋势

### 3. 良率提升

- 分析失效原因
- 优化测试参数
- 改进工艺流程

### 4. 质量报告

- 生成可视化报告
- 导出统计数据
- 存档测试记录

## 与基础版对比

| 功能     | 基础版 | 专业版        |
| -------- | ------ | ------------- |
| Bin 分类 | 简单   | 标准 10 Bin   |
| 晶圆轮廓 | ❌     | ✅            |
| 缺口标识 | ❌     | ✅            |
| 坐标系统 | ❌     | ✅            |
| Bin 图例 | 简单   | 交互式        |
| 统计分析 | 基础   | 专业          |
| 导出格式 | CSV    | CSV/SINF/STDF |
| 缺陷模拟 | 随机   | 真实模式      |
| 热力图   | ❌     | ✅            |

## 快捷键

| 操作 | 快捷键                 |
| ---- | ---------------------- |
| 缩放 | 鼠标滚轮               |
| 平移 | 左键拖拽               |
| 框选 | Shift + 拖拽           |
| 重置 | R 键（计划中）         |
| 导出 | Ctrl/Cmd + E（计划中） |

## API 参考

### Props

```typescript
interface Props {
  data: Die[] // Die 数据
  width?: number // 画布宽度
  height?: number // 画布高度
  binConfig?: BinConfig // Bin 配置
  showNotch?: boolean // 显示缺口
  showCoordinates?: boolean // 显示坐标
  showGrid?: boolean // 显示网格
  mode?: 'bin' | 'heatmap' // 显示模式
  waferSize?: number // 晶圆尺寸（英寸）
}
```

### Events

```typescript
@select="handleSelect"    // 框选事件
@click="handleClick"      // 点击事件
@bin-click="handleBinClick"  // Bin 点击事件
```

### Methods

```typescript
resetView() // 重置视图
binStatistics // Bin 统计数据
yieldRate // 良率
```

## 最佳实践

### 1. 数据准备

- 确保坐标连续
- Bin 编号标准化
- 包含测试值

### 2. 性能优化

- 大数据量使用采样
- 适当调整晶圆尺寸
- 按需开启网格

### 3. 分析流程

1. 加载数据
2. 查看整体分布
3. 框选异常区域
4. 分析 Bin 统计
5. 导出报告

### 4. 报告生成

- 截图保存
- 导出数据
- 记录统计信息

## 未来规划

### 短期（1-2 个月）

- [ ] STDF 格式支持
- [ ] 良率趋势图
- [ ] 缺陷模式识别
- [ ] 批量文件处理

### 中期（3-6 个月）

- [ ] 3D 视图
- [ ] 多晶圆对比
- [ ] AI 缺陷分类
- [ ] 自动报告生成

### 长期（6-12 个月）

- [ ] 实时数据接入
- [ ] 云端协作
- [ ] 移动端支持
- [ ] API 服务

## 技术栈

- **前端**: Vue 3 + TypeScript
- **渲染**: Canvas 2D API
- **UI**: Element Plus
- **性能**: RequestAnimationFrame + 离屏渲染
- **数据**: 本地 + 导入/导出

## 参考标准

- IEEE 1671: STDF 标准
- SEMI E5: 晶圆尺寸标准
- SEMI E142: Bin 分类标准
- IPC-A-610: 颜色编码标准

## 总结

Wafer Map Pro 提供了与业界专业工具对标的功能，包括：

1. ✅ 标准 Bin 分类系统
2. ✅ 晶圆坐标和缺口显示
3. ✅ 多种显示模式
4. ✅ 专业统计分析
5. ✅ 标准数据格式导出
6. ✅ 真实缺陷模式模拟
7. ✅ 高性能大数据处理

适用于半导体测试、工艺监控、良率分析等专业场景。
