// Simple script to create a favicon.ico (as PNG)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '../public/favicon.svg');
const icoPath = path.join(__dirname, '../public/favicon.ico');
const pngPath = path.join(__dirname, '../public/favicon.png');

async function createFaviconIco() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Create a 32x32 PNG for favicon.ico (simple solution)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(pngPath);
    
    // Copy the PNG to favicon.ico as a basic solution
    fs.copyFileSync(pngPath, icoPath);
    
    console.log('Basic favicon.ico created!');
  } catch (error) {
    console.error('Error creating favicon.ico:', error);
  }
}

createFaviconIco(); 