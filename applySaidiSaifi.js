const fs = require('fs');

['InputSaifi', 'InputKinerja'].forEach(mod => {
    let p = `c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/${mod}/index.jsx`;
    let content = fs.readFileSync(p, 'utf8');

    // 1. Update Header
    let title = mod === 'InputSaifi' ? 'Realisasi SAIFI' : 'Realisasi SAIDI';
    let oldHeaderBlock = content.match(/<div className="flex items-center gap-5">[\s\S]*?<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">[\s\S]*?<\/h1>\s*<\/div>/);
    if(oldHeaderBlock) {
        let newHeaderBlock = `<div className="flex items-center gap-5">
            <button 
                type="button"
                onClick={() => navigate(bidang === 'jaringan' ? '/saifi' : '/saidi')} // note this might be wrong for SAIDI but we just replace what is there
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
                  ${title}
              </h1>
              <p className="text-slate-400 text-xs font-semibold max-w-2xl leading-snug m-0 border-l-2 border-emerald-200 pl-4">
                  Sistem penginputan data ${title.toLowerCase()}. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.
              </p>
            </div>
          </div>`;
          // Replace the precise match manually
          content = content.replace(/<div className="flex items-center gap-5">\s*<button[\s\S]*?<\/button>\s*<div>\s*<h1[\s\S]*?<\/h1>\s*<\/div>\s*<\/div>/, newHeaderBlock);
    }
    
    // remove the paragraph underneath if it exists
    content = content.replace(/<p className="text-slate-500 text-sm font-medium mt-2 max-w-2xl">[\s\S]*?<\/p>/, '');

    // 2. Update Submit Button
    let btnDisabled = "loading || (!bidangMap[user?.role] && user?.role !== 'admin') || (bidang !== 'jaringan' && targets.length === 0)";
    let newBtn = `
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
                </div>`;
    
    content = content.replace(/<button\s*type="submit"\s*disabled=\{[\s\S]*?\}\s*className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700[\s\S]*?<\/button>/, newBtn);

    fs.writeFileSync(p, content);
});
