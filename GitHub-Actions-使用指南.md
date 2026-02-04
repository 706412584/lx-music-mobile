# GitHub Actions iOS 构建使用指南

## 📋 前提条件

1. ✅ 项目已推送到 GitHub
2. ✅ 已完成 iOS 基本配置（Bundle Identifier 等）
3. ⚠️ 如果需要签名，需要 Apple Developer 账号

## 🚀 快速开始

### 步骤 1: 添加 Workflow 文件

已创建文件：`.github/workflows/ios-build.yml`

### 步骤 2: 推送到 GitHub

```bash
git add .github/workflows/ios-build.yml
git commit -m "Add iOS build workflow"
git push
```

### 步骤 3: 手动触发构建

1. 打开 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **iOS Build** workflow
4. 点击 **Run workflow** 按钮
5. 选择构建类型（debug 或 release）
6. 点击 **Run workflow** 确认

### 步骤 4: 等待构建完成

- 构建时间：15-30 分钟
- 可以实时查看日志
- 构建完成后会显示绿色 ✅

### 步骤 5: 下载构建产物

1. 进入完成的 workflow run
2. 滚动到底部的 **Artifacts** 区域
3. 下载 `ios-build-debug` 或 `ios-build-release`

## 💰 费用说明

### 公开仓库
```
✅ 完全免费
✅ 无限次构建
✅ 无需信用卡
```

### 私有仓库（免费计划）
```
每月额度：2,000 分钟
macOS 倍率：10x
实际可用：200 分钟

每次构建约 20 分钟
可构建次数：约 10 次/月

💡 建议：
- 只在需要时手动触发
- 开发阶段使用 Android 测试
- 发布前再构建 iOS
```

### 查看使用情况

1. 打开 GitHub 设置
2. 进入 **Billing and plans**
3. 查看 **Actions** 使用量

## 🎯 优化技巧

### 1. 只在必要时构建

当前配置已优化为：
- ✅ 手动触发（不会自动消耗额度）
- ✅ 只在打 tag 时自动构建（发布版本）

### 2. 使用缓存

已配置：
- ✅ npm 依赖缓存
- ✅ CocoaPods 缓存
- 可节省 3-5 分钟/次

### 3. Debug vs Release

**Debug 构建（推荐用于测试）：**
- ⚡ 更快（10-15 分钟）
- 💰 节省额度
- ❌ 不需要签名
- ✅ 可以安装到测试设备

**Release 构建（用于发布）：**
- 🐌 较慢（20-30 分钟）
- 💰 消耗更多额度
- ✅ 需要签名
- ✅ 可以发布到 App Store

### 4. 控制构建频率

建议频率：
```
开发阶段：每周 1-2 次
测试阶段：每周 2-3 次
发布阶段：每次发布 1 次

总计：约 5-8 次/月（在免费额度内）
```

## 🔐 配置签名（可选）

如果需要构建可安装的 IPA，需要配置签名：

### 步骤 1: 准备签名文件

1. 从 Apple Developer 下载：
   - Distribution Certificate (.p12)
   - Provisioning Profile (.mobileprovision)

2. 转换为 Base64：
```bash
# macOS/Linux
base64 -i certificate.p12 -o certificate.txt
base64 -i profile.mobileprovision -o profile.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Out-File certificate.txt
[Convert]::ToBase64String([IO.File]::ReadAllBytes("profile.mobileprovision")) | Out-File profile.txt
```

### 步骤 2: 添加 GitHub Secrets

1. 打开仓库 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 secrets：

```
IOS_CERTIFICATE_BASE64: (certificate.txt 的内容)
IOS_CERTIFICATE_PASSWORD: (证书密码)
IOS_PROVISION_PROFILE_BASE64: (profile.txt 的内容)
```

### 步骤 3: 更新 Workflow

在 workflow 中添加签名步骤（需要时我可以帮你配置）

## 📊 实际使用示例

### 场景 1: 个人开发者

```
项目类型：私有仓库
构建频率：每周 2 次
每月构建：8 次
消耗时间：8 × 20 = 160 分钟
免费额度：200 分钟

✅ 完全够用！
```

### 场景 2: 小团队

```
项目类型：私有仓库
构建频率：每天 1 次
每月构建：30 次
消耗时间：30 × 20 = 600 分钟
免费额度：200 分钟

⚠️ 需要升级到 Pro ($4/月)
或改为手动触发
```

### 场景 3: 开源项目

```
项目类型：公开仓库
构建频率：无限制
消耗时间：无限制
免费额度：无限制

✅ 完全免费！
```

## 🆚 与其他方案对比

| 特性 | GitHub Actions | EAS Build | Codemagic |
|------|---------------|-----------|-----------|
| 公开仓库 | ✅ 完全免费 | ⚠️ 有限 | ⚠️ 有限 |
| 私有仓库 | ⚠️ 10次/月 | ⚠️ 有限 | ⚠️ 500分钟 |
| 配置难度 | ⭐⭐ | ⭐ | ⭐⭐ |
| 自定义程度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 构建速度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## ❓ 常见问题

### Q: 构建失败怎么办？
A: 查看 Actions 日志，常见问题：
- CocoaPods 安装失败 → 检查 Podfile
- 签名错误 → 检查证书配置
- 编译错误 → 检查代码是否有问题

### Q: 如何加速构建？
A: 
- 使用缓存（已配置）
- 减少依赖数量
- 使用 Debug 构建测试

### Q: 可以同时构建 Android 和 iOS 吗？
A: 可以！创建另一个 workflow 或在同一个 workflow 中添加 Android job

### Q: 免费额度用完了怎么办？
A: 
- 等待下个月重置
- 升级到 Pro ($4/月)
- 使用其他免费服务（EAS Build）
- 减少构建频率

### Q: 构建的 IPA 可以直接安装吗？
A: 
- Debug 构建：需要开发者证书
- Release 构建：需要 Distribution 证书
- 或通过 TestFlight 分发

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Actions 定价](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Xcode 命令行工具](https://developer.apple.com/xcode/)

## 🎉 总结

GitHub Actions 是在 Windows 上构建 iOS 的最佳免费方案：

✅ **优点：**
- 完全免费（公开仓库）
- 配置灵活
- 与 GitHub 深度集成
- 可以自动化整个流程

⚠️ **注意：**
- 私有仓库有额度限制
- 需要控制构建频率
- 首次配置需要一些时间

💡 **建议：**
- 如果可以，使用公开仓库
- 开发阶段主要用 Android 测试
- 发布前再构建 iOS
- 这样完全可以在免费额度内完成

---

需要帮助配置签名或遇到问题？随时问我！
