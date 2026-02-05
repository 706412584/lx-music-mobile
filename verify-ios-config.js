#!/usr/bin/env node

/**
 * iOS 配置验证脚本
 * 验证 iOS 项目配置是否正确
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 开始验证 iOS 配置...\n')

let hasError = false

// 1. 验证 project.pbxproj
console.log('📋 检查 project.pbxproj...')
const projectPath = path.join(__dirname, 'ios/LxMusicMobile.xcodeproj/project.pbxproj')
const projectContent = fs.readFileSync(projectPath, 'utf8')

// 检查 Bundle Identifier
const bundleIdMatches = projectContent.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)
console.log(`   找到 ${bundleIdMatches.length} 个 Bundle Identifier 配置`)

bundleIdMatches.forEach((match, index) => {
  const value = match.match(/= ([^;]+);/)[1]
  if (value === 'cn.xcwl.music.mobile' || value === 'cn.xcwl.music.mobile.tests') {
    console.log(`   ✅ [${index + 1}] ${value}`)
  } else {
    console.log(`   ❌ [${index + 1}] ${value} (应该是 cn.xcwl.music.mobile 或 cn.xcwl.music.mobile.tests)`)
    hasError = true
  }
})

// 检查版本号
const versionMatches = projectContent.match(/MARKETING_VERSION = ([^;]+);/g)
const buildMatches = projectContent.match(/CURRENT_PROJECT_VERSION = ([^;]+);/g)

console.log('\n   版本号配置:')
if (versionMatches && versionMatches.length > 0) {
  const version = versionMatches[0].match(/= ([^;]+);/)[1]
  if (version === '1.8.0') {
    console.log(`   ✅ MARKETING_VERSION = ${version}`)
  } else {
    console.log(`   ❌ MARKETING_VERSION = ${version} (应该是 1.8.0)`)
    hasError = true
  }
} else {
  console.log('   ❌ 未找到 MARKETING_VERSION')
  hasError = true
}

if (buildMatches && buildMatches.length > 0) {
  const build = buildMatches[0].match(/= ([^;]+);/)[1]
  if (build === '72') {
    console.log(`   ✅ CURRENT_PROJECT_VERSION = ${build}`)
  } else {
    console.log(`   ❌ CURRENT_PROJECT_VERSION = ${build} (应该是 72)`)
    hasError = true
  }
} else {
  console.log('   ❌ 未找到 CURRENT_PROJECT_VERSION')
  hasError = true
}

// 2. 验证 Info.plist
console.log('\n📋 检查 Info.plist...')
const infoPlistPath = path.join(__dirname, 'ios/LxMusicMobile/Info.plist')
const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8')

// 检查应用名称
if (infoPlistContent.includes('<string>洛雪音乐</string>')) {
  console.log('   ✅ 应用显示名称: 洛雪音乐')
} else {
  console.log('   ❌ 应用显示名称未设置为中文')
  hasError = true
}

// 检查开发区域
if (infoPlistContent.includes('<string>zh_CN</string>')) {
  console.log('   ✅ 开发区域: zh_CN')
} else {
  console.log('   ⚠️  开发区域未设置为 zh_CN')
}

// 检查权限配置
const permissions = [
  { key: 'NSAppTransportSecurity', name: '网络访问权限' },
  { key: 'UIBackgroundModes', name: '后台音频播放' },
  { key: 'NSPhotoLibraryUsageDescription', name: '照片库访问权限' },
  { key: 'ITSAppUsesNonExemptEncryption', name: '加密声明' },
]

console.log('\n   权限配置:')
permissions.forEach(({ key, name }) => {
  if (infoPlistContent.includes(`<key>${key}</key>`)) {
    console.log(`   ✅ ${name}`)
  } else {
    console.log(`   ❌ ${name} 未配置`)
    hasError = true
  }
})

// 3. 验证 package.json
console.log('\n📋 检查 package.json...')
const packagePath = path.join(__dirname, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

console.log(`   ✅ 版本: ${packageJson.version}`)
console.log(`   ✅ 版本号: ${packageJson.versionCode}`)

// 4. 验证 Android 配置对比
console.log('\n📋 检查 Android 配置...')
const androidBuildPath = path.join(__dirname, 'android/app/build.gradle')
const androidBuildContent = fs.readFileSync(androidBuildPath, 'utf8')

const androidNamespace = androidBuildContent.match(/namespace "([^"]+)"/)
const androidAppId = androidBuildContent.match(/applicationId "([^"]+)"/)

if (androidNamespace && androidAppId) {
  console.log(`   Android namespace: ${androidNamespace[1]}`)
  console.log(`   Android applicationId: ${androidAppId[1]}`)

  if (androidNamespace[1] === 'cn.xcwl.music.mobile' && androidAppId[1] === 'cn.xcwl.music.mobile') {
    console.log('   ✅ Android 包名与 iOS Bundle ID 一致')
  } else {
    console.log('   ❌ Android 包名与 iOS Bundle ID 不一致')
    hasError = true
  }
}

// 总结
console.log('\n' + '='.repeat(50))
if (hasError) {
  console.log('❌ 验证失败！请检查上述错误项')
  process.exit(1)
} else {
  console.log('✅ 所有配置验证通过！')
  console.log('\n📊 配置摘要:')
  console.log('   • Bundle ID: cn.xcwl.music.mobile')
  console.log('   • 版本: 1.8.0 (72)')
  console.log('   • 应用名称: 洛雪音乐')
  console.log('   • 权限配置: 完整')
  console.log('   • Android 同步: ✅')
  console.log('\n🚀 iOS 项目已完全适配，可以开始构建！')
}
