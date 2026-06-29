const fs = require('fs');
const path = require('path');

const dir = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages';
const folders = fs.readdirSync(dir).filter(f => f.startsWith('Input') && f !== 'InputEns' && f !== 'InputSaifi' && f !== 'InputKinerja');

folders.forEach(folder => {
    let p = path.join(dir, folder, 'index.jsx');
    if(!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');

    // 1. Remove Top Breadcrumb / Navigation text
    // The scaffold usually has something like:
    // <div className="mb-8">
    //    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
    //       <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
    //       <ChevronRight size={14} />
    //       <span>...</span>
    //    </div>
    // </div>
    // Let's just remove any breadcrumb div
    content = content.replace(/<div className="mb-4 flex items-center gap-2 text-sm text-slate-500 font-medium">[\s\S]*?<\/div>/, '');
    content = content.replace(/<div className="flex items-center gap-2 text-sm text-slate-500 mb-4">[\s\S]*?<\/div>/, '');

    // 2. Format the form fields
    // Generic form maps over `targets` and uses a `<div key={key} className="bg-white p-6 rounded-2xl...`
    // Let's replace the `bg-white p-6 rounded-2xl...` with the ENS style
    let oldInputBlock = content.match(/<div key=\{key\} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if(oldInputBlock) {
        let newInputBlock = `<div key={key} className="flex items-center gap-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all group hover:shadow-md">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl flex items-center justify-center group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
                                            <Target size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate pr-2" title={t.indikator}>{t.indikator}</label>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{t.satuan}</span>
                                            </div>
                                            <input 
                                                type="number" step="0.0001" 
                                                {...register(key)} 
                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800 font-extrabold text-sm md:text-base outline-none" 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>`;
        content = content.replace(oldInputBlock[0], newInputBlock);
    }

    // 3. Format the submit button!
    // Generic button:
    // <div className="mt-8 bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">
    //    <button type="submit" ...
    let oldSubmitBlock = content.match(/<div className="mt-8 bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">[\s\S]*?<\/div>/);
    if(!oldSubmitBlock) {
        oldSubmitBlock = content.match(/<div className="mt-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">[\s\S]*?<\/div>/);
    }
    
    if(oldSubmitBlock) {
        let btnDisabled = "loading || (!bidangMap[user?.role] && user?.role !== 'admin')";
        if(content.includes('targets.length === 0')) {
            btnDisabled += " || (targets.length === 0)";
        }
        
        let newSubmitBlock = `<div className="mt-8 flex justify-end">
            <div style={{
                display: 'inline-flex',
                background: 'rgba(37, 99, 235, 0.05)',
                padding: 4,
                borderRadius: 12,
                border: '1px solid rgba(37, 99, 235, 0.15)',
                cursor: ${btnDisabled} ? 'not-allowed' : 'pointer',
                opacity: ${btnDisabled} ? 0.6 : 1
            }}>
                <button 
                    type="submit"
                    disabled={${btnDisabled}}
                    style={{
                    padding: '12px 24px',
                    borderRadius: 9,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: ${btnDisabled} ? 'not-allowed' : 'pointer',
                    background: loading ? '#e2e8f0' : 'var(--bg-card, #ffffff)',
                    color: loading ? '#64748b' : '#2563EB',
                    boxShadow: loading ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                    }}
                    onMouseEnter={e => {
                        if(!(${btnDisabled})) {
                        e.currentTarget.style.background = '#2563EB';
                        e.currentTarget.style.color = '#FFFFFF';
                        }
                    }}
                    onMouseLeave={e => {
                        if(!(${btnDisabled})) {
                        e.currentTarget.style.background = 'var(--bg-card, #ffffff)';
                        e.currentTarget.style.color = '#2563EB';
                        }
                    }}
                >
                    {loading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <Save size={20} />}
                    Simpan Realisasi
                </button>
            </div>
        </div>`;
        content = content.replace(oldSubmitBlock[0], newSubmitBlock);
    }

    fs.writeFileSync(p, content);
});

// DO THE SAME FOR SAIDI AND SAIFI NON-JARINGAN PARTS!
['InputSaifi', 'InputKinerja'].forEach(mod => {
    let p = path.join(dir, mod, 'index.jsx');
    if(!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');

    let oldInputBlock = content.match(/<div key=\{key\} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if(oldInputBlock) {
        let newInputBlock = `<div key={key} className="flex items-center gap-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all group hover:shadow-md">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl flex items-center justify-center group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
                                            <Target size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate pr-2" title={t.indikator}>{t.indikator}</label>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{t.satuan}</span>
                                            </div>
                                            <input 
                                                type="number" step="0.0001" 
                                                {...register(key)} 
                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800 font-extrabold text-sm md:text-base outline-none" 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>`;
        content = content.replace(oldInputBlock[0], newInputBlock);
    }
    
    // submit block already replaced for Saidi/Saifi by restore script, but let's make it align right
    content = content.replace(/<div className="mt-8 bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">/, '<div className="mt-8 flex justify-end w-full">');

    fs.writeFileSync(p, content);
});
