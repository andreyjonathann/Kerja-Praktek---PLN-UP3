const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace previous cyan values with the new custom color #3AA8C1 and its variants
css = css.replace(/#0e7490/ig, '#2c8a9f'); // 700 -> 700
css = css.replace(/#0891b2/ig, '#3AA8C1'); // 600 -> Primary
css = css.replace(/#a5f3fc/ig, '#c5e8f0'); // 200 -> 200
css = css.replace(/#22d3ee/ig, '#5bb9ce'); // 400 -> 400

// Fix RGBAs (approximating #3AA8C1 to rgb(58, 168, 193))
css = css.replace(/rgba\(\s*14\s*,\s*116\s*,\s*144/g, 'rgba(44, 138, 159');
css = css.replace(/rgba\(\s*8\s*,\s*145\s*,\s*178/g, 'rgba(58, 168, 193');
css = css.replace(/rgba\(\s*6\s*,\s*182\s*,\s*212/g, 'rgba(91, 185, 206');

fs.writeFileSync(cssPath, css);
console.log('index.css updated to #3AA8C1');
