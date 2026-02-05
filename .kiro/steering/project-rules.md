---
inclusion: always
---

# 项目开发规则

## 文档创建规则

**重要：除非用户明确要求，否则不要创建 Markdown 文档来总结工作或记录过程。**

### 禁止自动创建的文档类型

- ❌ 工作总结文档（如 `xxx-总结.md`）
- ❌ 检查报告文档（如 `xxx-检查报告.md`）
- ❌ 适配清单文档（如 `xxx-适配清单.md`）
- ❌ 使用指南文档（如 `xxx-使用指南.md`）
- ❌ 任何未经用户明确要求的说明文档

### 例外情况

只有在以下情况下才可以创建文档：

1. ✅ 用户明确要求创建文档
2. ✅ 项目必需的配置文件（如 README.md、CHANGELOG.md 等）
3. ✅ 代码注释和文档字符串
4. ✅ API 文档（如果是项目的一部分）

### 正确的做法

完成工作后：
- ✅ 简洁地口头总结完成的内容
- ✅ 列出关键修改点（如果需要）
- ✅ 提供下一步建议（如果相关）
- ❌ 不要创建总结文档

## 代码风格

- 保持代码简洁，避免冗余
- 遵循项目现有的代码风格
- 优先使用项目已有的工具和库

## 提交规范

- 提交信息要清晰明确
- 一次提交只做一件事
- 重要修改要在提交信息中详细说明

## React Native 开发流程

### 开发服务器热更新

本项目是 React Native 应用，支持热更新（Hot Reload）功能：

1. **首次安装**：需要编译并安装 APK 到设备
   ```bash
   cd android
   .\gradlew.bat assembleDebug
   adb install -r -d app\build\outputs\apk\debug\lx-music-mobile-v1.8.1-universal.apk
   ```

2. **启动开发服务器**：
   ```bash
   npm start
   # 或
   npx react-native start
   ```

3. **代码修改后**：
   - ✅ **JavaScript/TypeScript 代码修改**：保存后自动热更新，无需重新打包
   - ✅ **样式修改**：保存后自动热更新
   - ✅ **组件修改**：保存后自动热更新
   - ❌ **原生代码修改**（Java/Kotlin/Objective-C）：需要重新编译安装
   - ❌ **依赖包变更**（package.json）：需要重新编译安装
   - ❌ **原生配置修改**（AndroidManifest.xml 等）：需要重新编译安装

4. **开发服务器运行时**：
   - 在设备上摇晃手机或按菜单键可打开开发者菜单
   - 选择"Reload"可手动刷新应用
   - 选择"Enable Hot Reloading"启用热更新
   - 选择"Enable Fast Refresh"启用快速刷新（推荐）

### 何时需要重新打包

只有以下情况需要重新编译和安装 APK：
- 修改了原生代码（android/ 目录下的 Java/Kotlin 文件）
- 添加或删除了 npm 依赖包
- 修改了原生配置文件（build.gradle、AndroidManifest.xml 等）
- 添加了新的原生模块或链接

### 开发建议

- 保持开发服务器运行，享受热更新带来的快速开发体验
- 大部分 UI 和逻辑修改都可以通过热更新立即看到效果
- 只在必要时才重新打包，节省开发时间
