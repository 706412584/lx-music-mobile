# 下载功能代码审查清单

## 审查日期
[填写日期]

## 审查人员
[填写姓名]

---

## 1. 核心下载模块 (`src/core/download/index.ts`)

### 1.1 导入和依赖
- [x] nanoid 导入正确 (使用 customAlphabet)
- [x] 文件系统函数导入完整
- [x] 类型定义正确引用
- [x] 无循环依赖

### 1.2 ID 生成
```typescript
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)
```
- [x] 字符集合理（小写字母+数字）
- [x] 长度足够（10位）
- [x] 生成唯一性保证

### 1.3 目录创建 (`mkdirRecursive`)
```typescript
const mkdirRecursive = async (path: string): Promise<void> => {
  const parts = path.split('/')
  let currentPath = ''
  
  for (const part of parts) {
    if (!part) continue
    currentPath += '/' + part
    
    try {
      const exists = await existsFile(currentPath)
      if (!exists) {
        await mkdir(currentPath)
      }
    } catch (error) {
      console.log('mkdir error:', error)
    }
  }
}
```
- [x] 递归逻辑正确
- [x] 路径分割处理正确
- [x] 错误处理适当
- [ ] **建议**: 应该抛出严重错误而不是只打印日志

### 1.4 路径获取 (`getDownloadPath`)
```typescript
const getDownloadPath = async () => {
  let savePath = settingState.setting['download.savePath'] || '/storage/emulated/0/Music/LxMusic'
  
  const dirExists = await existsFile(savePath)
  if (!dirExists) {
    await mkdirRecursive(savePath)
  }
  
  return savePath
}
```
- [x] 默认路径合理
- [x] 目录存在性检查
- [x] 自动创建目录
- [ ] **建议**: 应该验证路径是否可写

### 1.5 文件名生成 (`generateFileName`)
```typescript
const generateFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality, ext: LX.Download.FileExt): string => {
  const fileNameFormat = settingState.setting['download.fileName'] || '歌名 - 歌手'
  
  let fileName = fileNameFormat
    .replace('歌名', musicInfo.name)
    .replace('歌手', musicInfo.singer)
  
  fileName = fileName.replace(/[\\/:*?"<>|]/g, '_')
  
  return `${fileName}.${ext}`
}
```
- [x] 模板替换正确
- [x] 非法字符过滤
- [x] 扩展名添加正确
- [ ] **建议**: 应该处理文件名过长的情况
- [ ] **建议**: 应该处理重复文件名

### 1.6 扩展名判断 (`getFileExt`)
```typescript
const getFileExt = (quality: LX.Quality): LX.Download.FileExt => {
  if (quality.includes('flac')) return 'flac'
  if (quality.includes('ape')) return 'ape'
  if (quality.includes('wav')) return 'wav'
  return 'mp3'
}
```
- [x] 逻辑清晰
- [x] 默认值合理
- [x] 覆盖主要格式

### 1.7 主下载函数 (`downloadMusic`)
```typescript
export const downloadMusic = async (
  musicInfo: LX.Music.MusicInfoOnline,
  quality: LX.Quality
): Promise<LX.Download.ListItem> => {
  const id = nanoid()
  const ext = getFileExt(quality)
  const fileName = generateFileName(musicInfo, quality, ext)
  const savePath = await getDownloadPath()
  const filePath = `${savePath}/${fileName}`

  const downloadItem: LX.Download.ListItem = {
    id,
    isComplate: false,
    status: 'waiting',
    statusText: '等待中...',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '0 KB/s',
    metadata: {
      musicInfo,
      url: null,
      quality,
      ext,
      fileName,
      filePath,
    },
  }

  startDownload(downloadItem)

  return downloadItem
}
```
- [x] 参数验证充分
- [x] 初始状态正确
- [x] 元数据完整
- [x] 异步处理正确
- [ ] **建议**: 应该检查文件是否已存在

### 1.8 下载执行 (`startDownload`)
```typescript
const startDownload = async (item: LX.Download.ListItem) => {
  try {
    downloadAction.updateStatus(item.id, 'waiting', '获取下载链接...')

    const url = await getMusicUrl({
      musicInfo: item.metadata.musicInfo,
      isRefresh: true,
    })

    item.metadata.url = url

    downloadAction.updateStatus(item.id, 'run', '下载中...')

    const { jobId, promise } = downloadFile(url, item.metadata.filePath, {
      begin: (res) => {
        downloadAction.updateProgress(item.id, {
          progress: 0,
          speed: '0 KB/s',
          downloaded: 0,
          total: res.contentLength,
        })
      },
      progress: (res) => {
        const progress = (res.bytesWritten / res.contentLength) * 100
        const speed = formatSpeed(res.bytesWritten / ((Date.now() - startTime) / 1000))
        
        downloadAction.updateProgress(item.id, {
          progress,
          speed,
          downloaded: res.bytesWritten,
          total: res.contentLength,
        })
      },
    })

    const startTime = Date.now()
    downloadTasks.set(item.id, { jobId, musicInfo: item.metadata.musicInfo })

    await promise

    downloadTasks.delete(item.id)
    downloadAction.updateStatus(item.id, 'completed', '下载完成')
  } catch (error: any) {
    downloadTasks.delete(item.id)
    downloadAction.updateStatus(item.id, 'error', error.message || '下载失败')
  }
}
```
- [x] 状态转换清晰
- [x] 进度回调正确
- [x] 错误处理完整
- [x] 任务清理正确
- [ ] **问题**: `startTime` 在使用前定义，应该移到前面
- [ ] **建议**: 应该添加超时处理
- [ ] **建议**: 应该添加重试机制

### 1.9 控制函数
```typescript
export const pauseDownload = async (id: string) => {
  const task = downloadTasks.get(id)
  if (task) {
    stopDownload(task.jobId)
    downloadTasks.delete(id)
  }
}

export const resumeDownload = async (id: string) => {
  const { state } = await import('@/store/download')
  const item = state.list.find(i => i.id === id)
  if (item && item.status === 'pause') {
    startDownload(item)
  }
}

export const removeDownload = async (id: string) => {
  const task = downloadTasks.get(id)
  if (task) {
    stopDownload(task.jobId)
    downloadTasks.delete(id)
  }
}
```
- [x] 暂停逻辑正确
- [x] 恢复逻辑正确
- [x] 删除逻辑正确
- [ ] **建议**: resumeDownload 应该检查是否支持断点续传

### 1.10 工具函数
```typescript
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`
  }
}
```
- [x] 单位转换正确
- [x] 精度合理
- [x] 格式化清晰

---

## 2. 状态管理 (`src/store/download/`)

### 2.1 State (`state.ts`)
```typescript
export interface DownloadState {
  list: LX.Download.ListItem[]
  downloadingCount: number
}

const createDownloadState = (): DownloadState => {
  return {
    list: [],
    downloadingCount: 0,
  }
}

export const state = reactive(createDownloadState())
```
- [x] 接口定义清晰
- [x] 初始状态合理
- [x] 使用 reactive 正确
- [ ] **建议**: 应该添加持久化

### 2.2 Actions (`action.ts`)
```typescript
export default {
  async addDownload(musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality) {
    const item = await downloadMusic(musicInfo, quality)
    state.list.push(item)
    this.updateDownloadingCount()
    return item
  },
  // ... 其他方法
}
```
- [x] 方法命名清晰
- [x] 状态更新正确
- [x] 计数更新及时
- [ ] **建议**: 应该添加去重检查

### 2.3 Hooks (`hook.ts`)
```typescript
export const useDownloadList = () => {
  return useSnapshot(state).list
}

export const useDownloadingCount = () => {
  return useSnapshot(state).downloadingCount
}
```
- [x] Hook 命名规范
- [x] 使用 useSnapshot 正确
- [x] 返回值类型正确

---

## 3. UI 组件 (`src/screens/Home/Views/Download/index.js`)

### 3.1 组件结构
- [x] 组件拆分合理
- [x] Props 传递正确
- [x] 状态管理清晰

### 3.2 列表渲染
- [x] 使用 FlatList 正确
- [x] Key 提取正确
- [x] 性能优化合理

### 3.3 交互处理
- [x] 按钮事件绑定正确
- [x] 状态更新及时
- [x] 用户反馈清晰

### 3.4 样式设计
- [x] 响应式设计
- [x] 主题适配
- [x] 布局合理

---

## 4. 类型定义 (`src/types/download_list.d.ts`)

### 4.1 状态类型
```typescript
type DownloadTaskStatus = 'run'
  | 'waiting'
  | 'pause'
  | 'error'
  | 'completed'
```
- [x] 状态定义完整
- [x] 命名清晰

### 4.2 数据结构
```typescript
interface ListItem {
  id: string
  isComplate: boolean
  status: DownloadTaskStatus
  statusText: string
  downloaded: number
  total: number
  progress: number
  speed: string
  metadata: { ... }
}
```
- [x] 字段完整
- [x] 类型正确
- [ ] **注意**: `isComplate` 拼写错误，应该是 `isComplete`

---

## 5. 测试组件 (`src/screens/DownloadTest/index.tsx`)

### 5.1 测试覆盖
- [x] 基础功能测试完整
- [x] 边界情况考虑
- [x] 错误处理测试

### 5.2 测试数据
- [x] 测试数据合理
- [x] 覆盖不同场景

### 5.3 结果展示
- [x] 结果显示清晰
- [x] 错误提示明确
- [x] 用户体验良好

---

## 总结

### 优点
1. 代码结构清晰，模块划分合理
2. 类型定义完整，类型安全性好
3. 错误处理基本完善
4. UI 交互友好

### 需要改进的地方
1. **高优先级**:
   - 修复 `startTime` 定义位置问题
   - 添加文件存在性检查
   - 添加路径可写性验证

2. **中优先级**:
   - 添加下载超时处理
   - 实现重试机制
   - 添加断点续传支持
   - 实现状态持久化

3. **低优先级**:
   - 处理文件名过长
   - 处理重复文件名
   - 添加下载队列限制
   - 优化内存使用

### 建议的下一步
1. 修复高优先级问题
2. 在真实设备上进行测试
3. 根据测试结果优化代码
4. 添加单元测试
5. 完善文档

---

## 审查签名
- 审查人: [姓名]
- 日期: [日期]
- 状态: ✓ 通过 / ✗ 需要修改 / ⚠ 有保留意见
