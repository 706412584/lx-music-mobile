const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content
      .replace(/package cn\.toside\.music\.mobile/g, 'package cn.xcwl.music.mobile')
      .replace(/import cn\.toside\.music\.mobile/g, 'import cn.xcwl.music.mobile')
      .replace(/import static cn\.toside\.music\.mobile/g, 'import static cn.xcwl.music.mobile');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed:', filePath);
    }
  } catch (err) {
    console.error('Error processing', filePath, err);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.java')) {
      replaceInFile(filePath);
    }
  });
}

walkDir('android/app/src');
console.log('Done!');
