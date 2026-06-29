const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let content = fs.readFileSync(ensPath, 'utf8');

// Replace row wrappers to match SAIDI's responsive design
// From: className="flex items-center justify-between px-5 py-[20px]
// To: className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px]

content = content.replace(/className="flex items-center justify-between px-5 py-\[20px\]/g, 'className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px]');

// Also fix border colors and hover states to match SAIDI
content = content.replace(/border-\[#e5e7eb\]/g, 'border-[#f3f4f6]');
content = content.replace(/hover:bg-slate-50 cursor-pointer/g, 'hover:bg-slate-50/80 cursor-pointer');
content = content.replace(/hover:bg-slate-50 transition/g, 'hover:bg-slate-50/50 transition');

fs.writeFileSync(ensPath, content);
console.log('Fixed row responsiveness in ENS.');
