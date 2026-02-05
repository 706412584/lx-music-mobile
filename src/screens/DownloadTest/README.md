# 下载功能测试套件

## 概述

本测试套件用于验证 LX Music Mobile 的下载功能是否正常工作。包含测试组件、测试指南和代码审查清单。

## 文件结构

```
src/screens/DownloadTest/
├── index.tsx           # 测试组件（可视化测试界面）
├── README.md           # 本文件
├── TEST_GUIDE.md       # 详细测试指南
├── manual-test.md      # 手动测试记录模板
└── code-review.md      # 代码审查清单
```

## 快速开始

### 1. 集成测试组件

在 `src/navigation/registerScreens.tsx` 中注册测试屏幕:

```typescript
import DownloadTest from '@/screens/DownloadTest'

// 在注册函数中添加
Navigation.registerComponent('DownloadTest', () => DownloadTest)
```

### 2. 添加导航入口

在开发菜单或设置页面添加入口:

```typescript
Navigation.push(componentId, {
  component: {
    name: 'DownloadTest',
    options: {
      topBar: {
        title: {
          text: '下载测试'
        }
      }
    }
  }
})
```

### 3. 运行测试

1. 启动应用
2. 导航到下载测试页面
3. 按顺序执行测试用例
4. 观察测试结果
5. 记录发现的问题

## 测试用例

### 基础功能测试

1. **测试1: 添加单个下载** - 验证能否成功添加一个下载任务
2. **测试2: 添加多个下载** - 验证批量添加下载任务的功能
3. **测试3: 暂停下载** - 验证暂停功能是否正常工作
4. **测试4: 恢复下载** - 验证恢复暂停任务的功能
5. **测试5: 删除任务** - 验证删除任务功能
6. **测试6: 清除已完成** - 验证批量清除已完成任务的功能
7. **测试7: 清空所有** - 验证清空所有任务的功能

## 测试组件功能

### 可视化界面

- **测试按钮**: 7个测试按钮，每个对应一个测试用例
- **测试结果**: 实时显示测试执行结果
- **任务列表**: 显示当前所有下载任务的状态
- **任务计数**: 显示当前任务总数

### 测试数据

测试组件使用模拟的音乐数据:

```typescript
const testMusicList: LX.Music.MusicInfoOnline[] = [
  {
    id: 'test_001',
    name: '测试歌曲1',
    singer: '测试歌手1',
    source: 'kw',
    // ...
  },
  // ...
]
```

## 已修复的问题

### 1. startTime 变量定义位置错误

**问题**: 在 `src/core/download/index.ts` 中，`startTime` 变量在使用后才定义

**修复**: 将 `startTime` 的定义移到 `downloadFile` 调用之前

```typescript
// 修复前
const { jobId, promise } = downloadFile(url, item.metadata.filePath, {
  progress: (res) => {
    const speed = formatSpeed(res.bytesWritten / ((Date.now() - startTime) / 1000))
    // ...
  },
})
const startTime = Date.now() // ❌ 使用后才定义

// 修复后
const startTime = Date.now() // ✓ 使用前定义
const { jobId, promise } = downloadFile(url, item.metadata.filePath, {
  progress: (res) => {
    const speed = formatSpeed(res.bytesWritten / ((Date.now() - startTime) / 1000))
    // ...
  },
})
```

## 测试结果

### 代码静态检查

- ✓ TypeScript 编译通过
- ✓ 无类型错误
- ✓ 无语法错误
- ✓ 导入依赖正确

### 代码审查发现

详见 `code-review.md`，主要发现:

**优点**:
- 代码结构清晰，模块划分合理
- 类型定义完整，类型安全性好
- 错误处理基本完善
- UI 交互友好

**需要改进**:
- 添加文件存在性检查
- 添加路径可写性验证
- 添加下载超时处理
- 实现重试机制
- 添加断点续传支持
- 实现状态持久化

## 下一步

### 立即执行

1. ✓ 修复 startTime 变量定义位置问题
2. [ ] 在真实设备上运行测试组件
3. [ ] 执行所有测试用例
4. [ ] 记录测试结果

### 短期计划

1. [ ] 添加文件存在性检查
2. [ ] 添加路径可写性验证
3. [ ] 优化错误处理
4. [ ] 添加更多边界情况测试

### 长期计划

1. [ ] 实现下载超时处理
2. [ ] 添加重试机制
3. [ ] 实现断点续传
4. [ ] 添加状态持久化
5. [ ] 实现自动化测试

## 相关文档

- [测试指南](./TEST_GUIDE.md) - 详细的测试步骤和验证点
- [手动测试记录](./manual-test.md) - 测试记录模板
- [代码审查清单](./code-review.md) - 完整的代码审查结果

## 注意事项

1. **真实环境测试**: 需要在真实设备上测试，模拟器可能无法完全模拟文件系统行为
2. **网络环境**: 测试需要稳定的网络连接
3. **存储空间**: 确保设备有足够的存储空间
4. **权限**: 确保应用有存储权限

## 贡献

如果发现问题或有改进建议，请:

1. 在 `manual-test.md` 中记录问题
2. 更新 `code-review.md` 中的审查结果
3. 提交代码修复
4. 更新相关文档

## 许可

本测试套件遵循项目主许可证 Apache-2.0
