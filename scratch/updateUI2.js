const fs = require('fs');
const path = require('path');
const dir = 'c:\\laragon\\www\\Kerja-Praktek---PLN-UP3\\Frontend\\src\\pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Input') && f !== 'InputEns' && f !== 'InputSaifi' && f !== 'InputKinerja');

const oldSelectClassRegex = /className="[^"]*rounded-xl[^"]*"/g; 
const oldDataInputClassRegex = /className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"/g;
const oldDataInputClassRegex2 = /className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500\/20 text-slate-800 font-bold transition placeholder:text-slate-300"/g;
// some inputs might have slightly different classes. Let's just find all inputs with type="number" and {...register

function run() {
    for (let f of files) {
        let p = path.join(dir, f, 'index.jsx');
        if (fs.existsSync(p)) {
            let content = fs.readFileSync(p, 'utf8');
            let original = content;

            // 1. Update <select> and <input> inside period block
            // To do this safely, we search for <select and <input type="number" ... register('tahun'
            
            // Replaces the Select for Bulan/Periode
            content = content.replace(/<select\s+([^>]*\{...register\('(bulan|periode_id)'[^>]*)[^>]*className="[^"]*"([^>]*)>/g, '<select \n                            $1 \n                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold cursor-pointer appearance-none"$3>');
            
            // Replaces the Input for Tahun
            content = content.replace(/<input\s+([^>]*\{...register\('tahun'[^>]*)[^>]*className="[^"]*"([^>]*)>/g, '<input \n                            $1 \n                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold text-center"$2>');

            // 2. Update Data Input Boxes (all other register fields that are numbers)
            // They typically look like: className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"
            content = content.replace(/className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"/g, 'className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold transition"');

            content = content.replace(/className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500\/20 text-slate-800 font-bold text-center transition placeholder:text-slate-300"/g, 'className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-center transition placeholder:text-slate-300"');
            
            // If they are in a grid with "gap-12px" background block, let's remove that restrictive style to match ENS
            content = content.replace(/style=\{\{\s*display:\s*'flex',\s*flexWrap:\s*'wrap',\s*alignItems:\s*'center',\s*gap:\s*'12px',\s*background:\s*'rgba\(37,\s*99,\s*235,\s*0\.05\)',\s*padding:\s*'8px 12px',\s*borderRadius:\s*16,\s*border:\s*'1px solid rgba\(37,\s*99,\s*235,\s*0\.15\)',\s*\}\}/g, 'className="grid grid-cols-2 gap-4 w-full"');
            
            // Also, replace the outer wrapper of the PERIODE SETTINGS to card p-5
            content = content.replace(/<div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">/g, '<div className="p-5 flex flex-col items-start gap-4 w-full">');

            if(content !== original) {
                fs.writeFileSync(p, content);
                console.log('Updated', f);
            } else {
                console.log('No change needed or matched for', f);
            }
        }
    }
}
run();
