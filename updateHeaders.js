const fs = require('fs');
const path = require('path');

const pagesDir = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages';
const modules = [
    { dir: 'InputSaifi', title: 'Tambah SAIFI', route: '/saifi' },
    { dir: 'InputKinerja', title: 'Tambah SAIDI', route: '/saidi' },
    { dir: 'InputGangguanTm', title: 'Tambah Gangguan TM', route: '/gangguan-tm' },
    { dir: 'InputGangguanSwitching', title: 'Tambah Gangguan Switching', route: '/gangguan-switching' },
    { dir: 'InputMttr', title: 'Tambah MTTR', route: '/mttr' },
    { dir: 'InputMvod', title: 'Tambah MVOD', route: '/mvod' },
    { dir: 'InputRatingNegatif', title: 'Tambah Rating Negatif', route: '/rating-negatif' },
    { dir: 'InputRptGangguan', title: 'Tambah RPT Gangguan', route: '/rpt-gangguan' },
    { dir: 'InputSrdag', title: 'Tambah SRDAG', route: '/srdag' }
];

modules.forEach(mod => {
    const filePath = path.join(pagesDir, mod.dir, 'index.jsx');
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace the root div
    content = content.replace(/<div className="p-4 md:p-8 lg:p-10 animate-fade-in w-full flex flex-col">/, '<div className="bg-slate-50 min-h-screen w-full flex flex-col animate-fade-in relative">');

    // 2. Extract disabled logic from submit button
    let disabledMatch = content.match(/<button[\s\S]*?type=\"submit\"[\s\S]*?disabled=\{(.*?)\}/);
    let disabledLogic = disabledMatch ? disabledMatch[1] : 'loading';

    // 3. Remove the existing header (matches from {/* Header */} down to the first success alert or <form)
    // Actually, it's safer to use a regex that looks for {/* Header */} and removes everything up to but not including {success &&
    content = content.replace(/\{\/\*\s*Header\s*\*\/\}.*?(?=\{success\s*&&|<form)/s, '');

    // 4. Remove the bottom section (from {/* BOTTOM SECTION or <div className="mt-8 flex justify-end"> up to </form>)
    // Different files might have different bottom sections. Let's find the submit button wrapper.
    content = content.replace(/\{\/\*\s*BOTTOM SECTION: Submit Button\s*\*\/\}.*?(?=<\/form>)/s, '');
    // Some might not have that comment, let's also remove the div containing the type="submit"
    if (!content.match(/\{\/\*\s*BOTTOM SECTION/)) {
        content = content.replace(/<div[^>]*>\s*<button[^>]*type="submit"[^>]*>[\s\S]*?<\/button>\s*<\/div>/s, '');
        // We'll also remove any <div className="mt-8 ... flex justify-end">...</div>
        content = content.replace(/<div className="mt-8[^>]*>[\s\S]*?<button[^>]*type="submit"[\s\S]*?<\/div>\s*<\/div>/s, '');
    }

    // 5. Build the new Sticky Header
    const newHeader = `
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm mb-6">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600">
               <Activity size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 ${mod.title}
               </h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div style={{
               display: 'inline-flex',
               background: 'rgba(100, 116, 139, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(100, 116, 139, 0.15)',
               cursor: 'pointer'
             }}>
               <button 
                  type="button" 
                  onClick={() => navigate('${mod.route}')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                       e.currentTarget.style.background = '#f1f5f9';
                       e.currentTarget.style.color = '#334155';
                  }}
                  onMouseLeave={e => {
                       e.currentTarget.style.background = 'transparent';
                       e.currentTarget.style.color = '#64748b';
                  }}
               >
                  Batal
               </button>
             </div>
             <div style={{
               display: 'inline-flex',
               background: 'rgba(37, 99, 235, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(37, 99, 235, 0.15)',
               cursor: ${disabledLogic} ? 'not-allowed' : 'pointer',
               opacity: ${disabledLogic} ? 0.6 : 1
             }}>
               <button 
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={${disabledLogic}}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: ${disabledLogic} ? 'not-allowed' : 'pointer',
                    background: loading ? '#e2e8f0' : 'var(--bg-card, #ffffff)',
                    color: loading ? '#64748b' : '#2563EB',
                    boxShadow: loading ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                     if(!(${disabledLogic})) {
                       e.currentTarget.style.background = '#2563EB';
                       e.currentTarget.style.color = '#FFFFFF';
                     }
                  }}
                  onMouseLeave={e => {
                     if(!(${disabledLogic})) {
                       e.currentTarget.style.background = 'var(--bg-card, #ffffff)';
                       e.currentTarget.style.color = '#2563EB';
                     }
                  }}
               >
                  {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Realisasi
               </button>
             </div>
          </div>
        </div>
      </div>
      `;

    // Inject the new header right after the root div
    content = content.replace(/<div className="bg-slate-50 min-h-screen w-full flex flex-col animate-fade-in relative">\\s*/, '<div className="bg-slate-50 min-h-screen w-full flex flex-col animate-fade-in relative">\\n\\n' + newHeader + '\\n\\n');

    fs.writeFileSync(filePath, content);
    console.log('Updated ' + mod.dir);
});
