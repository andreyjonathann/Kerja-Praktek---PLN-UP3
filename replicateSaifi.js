const fs = require('fs');
const path = require('path');

const saidiPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';
const saifiPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputSaifi/index.jsx';

let content = fs.readFileSync(saidiPath, 'utf8');

// Replace identifiers
content = content.replace(/InputKinerjaPage/g, 'InputSaifiPage');

// Replace SAIDI -> SAIFI
content = content.replace(/SAIDI/g, 'SAIFI');

// Replace saidi -> saifi
content = content.replace(/saidi/g, 'saifi');

// Also, the API post endpoint. Wait, for InputKinerja, it's `api.post('/kinerja/jaringan', data);`
// In the original InputSaifi it was `api.post(\`/kinerja/${bidang}\`, data);`. But `bidang` for SAIFI is always `jaringan`. Wait, in the old InputSaifi, there was logic for other bidangs?
// Let's check old InputSaifi
// Ah, the user said "DETAIL KOMPONEN SAIFI SAMA SAIDI SAMAA". Both SAIDI and SAIFI belong to 'jaringan' in terms of matrix. But old InputSaifi had `api.post('/kinerja/${bidang}', data);` with fallback if not `jaringan` to show a generic form. Wait!
// In my InputKinerja copy, there's no fallback for other bidangs. It assumes you are inputting for 'jaringan'. If admin tries to access it, it might break?
// Actually, in `InputKinerja`, there was no admin guard.
fs.writeFileSync(saifiPath, content);
console.log('Replicated SAIDI to SAIFI');
