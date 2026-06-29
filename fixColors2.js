const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Colors: teal to cyan
css = css.replace(/#0f766e/ig, '#0e7490'); // 700
css = css.replace(/#0d9488/ig, '#0891b2'); // 600
css = css.replace(/#ccfbf1/ig, '#a5f3fc'); // 200/100
css = css.replace(/#14b8a6/ig, '#22d3ee'); // 400/500

// RGBAs
css = css.replace(/rgba\(\s*15\s*,\s*118\s*,\s*110/g, 'rgba(14, 116, 144');
css = css.replace(/rgba\(\s*13\s*,\s*148\s*,\s*136/g, 'rgba(8, 145, 178');
css = css.replace(/rgba\(\s*20\s*,\s*184\s*,\s*166/g, 'rgba(6, 182, 212');

fs.writeFileSync(cssPath, css);
console.log('index.css updated to cyan');
