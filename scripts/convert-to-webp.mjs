import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const EXTENSIONS = ['.png', '.jpg', '.jpeg'];
// Keep logo.jpg for favicon compatibility
const SKIP_FILES = ['vite.svg', '.nojekyll'];

const files = fs.readdirSync(PUBLIC_DIR);
let converted = 0;
let totalSavedBytes = 0;

for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!EXTENSIONS.includes(ext)) continue;
    if (SKIP_FILES.includes(file)) continue;

    const inputPath = path.join(PUBLIC_DIR, file);
    const baseName = path.basename(file, ext);
    const outputPath = path.join(PUBLIC_DIR, `${baseName}.webp`);

    const stat = fs.statSync(inputPath);
    
    try {
        await sharp(inputPath)
            .webp({ quality: 82, effort: 6 })
            .toFile(outputPath);
        
        const newStat = fs.statSync(outputPath);
        const saved = stat.size - newStat.size;
        totalSavedBytes += saved;
        
        console.log(`✓ ${file} (${(stat.size/1024).toFixed(0)} KB) → ${baseName}.webp (${(newStat.size/1024).toFixed(0)} KB) [saved ${(saved/1024).toFixed(0)} KB]`);
        converted++;
    } catch (err) {
        console.error(`✗ Failed: ${file} - ${err.message}`);
    }
}

console.log(`\nConverted ${converted} images. Total saved: ${(totalSavedBytes/1024/1024).toFixed(2)} MB`);
