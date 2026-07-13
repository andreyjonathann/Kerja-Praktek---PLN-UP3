const fs = require('fs');
let c = fs.readFileSync('Frontend/src/pages/InputSaifi/index.jsx', 'utf8');

c = c.replace(
  /\{\s*loading\s*\?\s*<div[^>]+><\/div>\s*:\s*<Save[^>]*\/>\s*\}\s*Simpan Realisasi\s*<\/button>/g,
  `{loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}\n                  {isDuplicate ? "Data Sudah Ada" : "Simpan Realisasi"}\n               </button>`
);

fs.writeFileSync('Frontend/src/pages/InputSaifi/index.jsx', c);
console.log("Replaced Simpan Realisasi in Saifi");
