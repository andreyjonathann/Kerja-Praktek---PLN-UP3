const fs = require('fs');
const path = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Red Button with Blue Button
// First, the wrapper div
content = content.replace('background: \'rgba(239, 68, 68, 0.05)\'', 'background: \'rgba(37, 99, 235, 0.05)\'');
content = content.replace('border: \'1px solid rgba(239, 68, 68, 0.15)\'', 'border: \'1px solid rgba(37, 99, 235, 0.15)\'');

// Then, the button background and colors
content = content.replace('background: loading ? \'#fca5a5\' : \'#ef4444\'', 'background: loading ? \'#e2e8f0\' : \'var(--bg-card, #ffffff)\'');
content = content.replace('color: \'#ffffff\'', 'color: loading ? \'#64748b\' : \'#2563EB\'');
content = content.replace('boxShadow: loading ? \'none\' : \'0 2px 8px rgba(239, 68, 68, 0.25)\'', 'boxShadow: loading ? \'none\' : \'0 2px 8px rgba(37, 99, 235, 0.15)\'');

// Hover effects
content = content.replace('e.currentTarget.style.background = \'#dc2626\'', 'e.currentTarget.style.background = \'#2563EB\'; e.currentTarget.style.color = \'#FFFFFF\'');
content = content.replace('e.currentTarget.style.background = \'#ef4444\'', 'e.currentTarget.style.background = \'var(--bg-card, #ffffff)\'; e.currentTarget.style.color = \'#2563EB\'');

fs.writeFileSync(path, content);
console.log('Button changed to blue');
