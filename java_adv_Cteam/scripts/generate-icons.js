const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG 파일 경로
const svgPath = path.join(__dirname, '../public/logo.svg');
const faviconSvgPath = path.join(__dirname, '../public/favicon.svg');

// 출력 디렉토리
const outputDir = path.join(__dirname, '../public');

// 192x192 PNG 생성
sharp(svgPath)
  .resize(192, 192)
  .png()
  .toFile(path.join(outputDir, 'logo192.png'))
  .catch(err => console.error('Error generating logo192.png:', err));

// 512x512 PNG 생성
sharp(svgPath)
  .resize(512, 512)
  .png()
  .toFile(path.join(outputDir, 'logo512.png'))
  .catch(err => console.error('Error generating logo512.png:', err));

// favicon.ico 생성
sharp(faviconSvgPath)
  .resize(32, 32)
  .toFormat('ico')
  .toFile(path.join(outputDir, 'favicon.ico'))
  .catch(err => console.error('Error generating favicon.ico:', err)); 