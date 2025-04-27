#!/usr/bin/env node

// This is a script to generate favicon files from the main SVG
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Would need to npm install sharp
const svg2ico = require('svg2ico'); // Would need to npm install svg2ico

const FAVICON_SIZES = [16, 32, 48, 96, 128, 192, 256, 512];
const PUBLIC_DIR = path.join(__dirname, '../public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function generateFavicons() {
  try {
    console.log('Reading SVG file...');
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    // Generate PNG files
    for (const size of FAVICON_SIZES) {
      console.log(`Generating ${size}x${size} PNG...`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
    }
    
    // Generate specific sizes needed for different platforms
    console.log('Generating apple-touch-icon.png...');
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    
    console.log('Generating android-chrome-192x192.png...');
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
    
    console.log('Generating android-chrome-512x512.png...');
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));
    
    // Generate favicon.ico with multiple sizes
    console.log('Generating favicon.ico...');
    const icoBuffer = await svg2ico(svgBuffer, { sizes: [16, 32, 48] });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

// Run immediately
generateFavicons();

// Note: This script requires the following dependencies:
// npm install sharp svg2ico 