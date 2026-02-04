#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取 package.json
const packageJson = require('../package.json');
const version = packageJson.version;
const versionCode = packageJson.versionCode;

console.log(`Syncing iOS version to ${version} (${versionCode})`);

// 读取 project.pbxproj
const pbxprojPath = path.join(__dirname, '../ios/LxMusicMobile.xcodeproj/project.pbxproj');
let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

// 替换 MARKETING_VERSION
pbxproj = pbxproj.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);

// 替换 CURRENT_PROJECT_VERSION
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`);

// 写回文件
fs.writeFileSync(pbxprojPath, pbxproj, 'utf8');

console.log('iOS version synced successfully!');
