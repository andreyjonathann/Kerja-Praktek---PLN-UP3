const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Colors
css = css.replace(/#005BAC/ig, '#0f766e');
css = css.replace(/#2563EB/ig, '#0d9488');
css = css.replace(/#93C5FD/ig, '#ccfbf1');
css = css.replace(/#0F4CD7/ig, '#0f766e');
css = css.replace(/#1E63F5/ig, '#0d9488');
css = css.replace(/#E2EEFF/ig, '#ccfbf1');
css = css.replace(/#2F7BFF/ig, '#14b8a6');
css = css.replace(/#154785/ig, '#0f766e');
css = css.replace(/#1D4ED8/ig, '#0f766e');

// RGBAs
css = css.replace(/rgba\(\s*15\s*,\s*76\s*,\s*215/g, 'rgba(15, 118, 110');
css = css.replace(/rgba\(\s*37\s*,\s*99\s*,\s*235/g, 'rgba(13, 148, 136');
css = css.replace(/rgba\(\s*59\s*,\s*130\s*,\s*246/g, 'rgba(20, 184, 166');

fs.writeFileSync(cssPath, css);
console.log('index.css updated');
