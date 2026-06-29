const fs = require('fs');
const path = require('path');
const dir = 'c:\\laragon\\www\\Kerja-Praktek---PLN-UP3\\Frontend\\src\\pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Input') && f !== 'InputEns');

function run() {
    for (let f of files) {
        let p = path.join(dir, f, 'index.jsx');
        if (fs.existsSync(p)) {
            let content = fs.readFileSync(p, 'utf8');
            
            // 1. Replace the entire PERIODE SETTINGS block
            const startStr = '{/* PERIODE SETTINGS */}';
            const endStr = 'Wajib pilih bulan dan tahun!</p>}\n                  </div>\n                </div>';
            
            const startIndex = content.indexOf(startStr);
            const endIndex = content.indexOf(endStr);
            
            if (startIndex !== -1 && endIndex !== -1) {
                console.log(`Matched Periode block in ${f}`);
                const fullEndIndex = endIndex + endStr.length;
                
                const newPeriode = `{/* PERIODE SETTINGS */}
                <div className="card p-5 bg-white mb-[36px]">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Pilih Periode</h3>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="relative">
                        <select 
                            {...register('periode_id', { required: true })} 
                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold cursor-pointer appearance-none"
                        >
                            <option value="">-- Bulan --</option>
                            {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
      
                    <input 
                        type="number"
                        {...register('tahun', { required: true })} 
                        placeholder="Tahun"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold"
                    />
                  </div>
                  {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-3"><AlertCircle size={12}/> Wajib isi periode</p>}
                </div>`;
                
                content = content.substring(0, startIndex) + newPeriode + content.substring(fullEndIndex);
            } else {
                console.log(`NO Match for Periode block in ${f}`);
            }

            // 2. Replace input fields in Jaringan
            const inputRegex1 = /className="w-1\/2 px-2 py-1\.5 bg-white border border-slate-200 rounded outline-none focus:border-(blue|emerald)-500 text-slate-700 text-sm"/g;
            content = content.replace(inputRegex1, 'className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"');
            
            // 3. Replace Non-Jaringan input fields
            const inputRegex2 = /className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-none outline-none focus:ring-4 focus:ring-blue-500\/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-blue-200"/g;
            content = content.replace(inputRegex2, 'className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"');
            
            // 4. Update wrapper classes from `rounded-none border-2 border-slate-100` to `rounded-2xl border border-slate-200`
            content = content.replace(/bg-white p-6 rounded-none border-2 border-slate-100/g, 'bg-white p-6 rounded-2xl border border-slate-200');

            fs.writeFileSync(p, content);
        }
    }
}
run();
