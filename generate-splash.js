const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = 'assets/splash-icon.png';
const ANDROID_RES_DIR = 'android/app/src/main/res';

// Base size for mdpi
const BASE_SIZE = 250;

const DENSITIES = {
  'mdpi': 1,
  'hdpi': 1.5,
  'xhdpi': 2,
  'xxhdpi': 3,
  'xxxhdpi': 4,
};

async function generateSplashScreens() {
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`Error: Source image not found at ${SOURCE_IMAGE}`);
    process.exit(1);
  }

  for (const [density, multiplier] of Object.entries(DENSITIES)) {
    const targetSize = Math.round(BASE_SIZE * multiplier);
    const targetDir = path.join(ANDROID_RES_DIR, `drawable-${density}`);
    const targetFile = path.join(targetDir, 'splashscreen_logo.png');

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      await sharp(SOURCE_IMAGE)
        .resize({
          width: targetSize,
          height: targetSize,
          fit: 'contain',
          background: { r: 15, g: 17, b: 21, alpha: 0 } // Transparent background matching #0f1115
        })
        .toFile(targetFile);
      
      console.log(`✅ Generated ${density} (${targetSize}x${targetSize}) -> ${targetFile}`);
    } catch (err) {
      console.error(`❌ Failed to generate ${density}:`, err.message);
    }
  }
}

generateSplashScreens();
