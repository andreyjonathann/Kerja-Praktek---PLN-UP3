const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let content = fs.readFileSync(ensPath, 'utf8');

// The trend chart block starts at: {/* 6 MONTH TREND CHART */}
// And it ends around line 506: )}
// We can just find the start and slice it out.
const trendStart = content.indexOf('{/* 6 MONTH TREND CHART */}');
if (trendStart !== -1) {
    const stringAfterTrend = '      </div>\n    </div>\n  );\n}';
    const trendEnd = content.indexOf(stringAfterTrend);
    if (trendEnd !== -1) {
        content = content.substring(0, trendStart) + content.substring(trendEnd);
    }
}

// Ensure the "Pilih Periode" font style matches SAIDI/SAIFI
// SAIDI: text-xs font-bold text-slate-500 mb-3
// ENS: text-sm font-bold text-slate-800 mb-4
content = content.replace('text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Pilih Periode', 'text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Pilih Periode');

fs.writeFileSync(ensPath, content);
console.log('Cleaned up ENS page to match SAIDI/SAIFI completely.');
