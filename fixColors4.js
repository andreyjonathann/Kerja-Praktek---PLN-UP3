const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace previous custom cyan values with official PLN Mobile colors
css = css.replace(/#2c8a9f/ig, '#035B71'); // Dark Teal
css = css.replace(/#3AA8C1/ig, '#00A2B9'); // Light Teal
css = css.replace(/#c5e8f0/ig, '#90ddec'); // Light accent
css = css.replace(/#5bb9ce/ig, '#2ab4d4'); // Mid accent

// Fix RGBAs
css = css.replace(/rgba\(\s*44\s*,\s*138\s*,\s*159/g, 'rgba(3, 91, 113'); // Dark Teal
css = css.replace(/rgba\(\s*58\s*,\s*168\s*,\s*193/g, 'rgba(0, 162, 185'); // Light Teal
css = css.replace(/rgba\(\s*91\s*,\s*185\s*,\s*206/g, 'rgba(42, 180, 212'); // Another mid teal

fs.writeFileSync(cssPath, css);
console.log('index.css updated to official PLN Mobile colors');
