const fs = require('fs');
const path = require('path');

// 读取 package.json
const packageJson = require('../package.json');
const appName = packageJson.AppName || packageJson.displayName || packageJson.name;

console.log(`同步应用名称: ${appName}`);

// 更新 Android strings.xml
const androidStringsPath = path.join(__dirname, '../android/app/src/main/res/values/strings.xml');
const androidStringsContent = `<resources>
    <string name="app_name">${appName}</string>
</resources>
`;

fs.writeFileSync(androidStringsPath, androidStringsContent, 'utf8');
console.log('✓ Android strings.xml 已更新');

// 更新 iOS Info.plist
const iosInfoPlistPath = path.join(__dirname, '../ios/LxMusicMobile/Info.plist');
let iosInfoPlistContent = fs.readFileSync(iosInfoPlistPath, 'utf8');

// 替换 CFBundleDisplayName
iosInfoPlistContent = iosInfoPlistContent.replace(
  /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
  `$1${appName}$2`
);

fs.writeFileSync(iosInfoPlistPath, iosInfoPlistContent, 'utf8');
console.log('✓ iOS Info.plist 已更新');

console.log('\n应用名称同步完成！');
