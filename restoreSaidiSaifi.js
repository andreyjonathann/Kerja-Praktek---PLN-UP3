const fs = require('fs');

const createJaringanBlock = (type) => `            {/* Jaringan Layout */}
            {bidang === 'jaringan' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-blue-600">Matriks Jaringan (${type.toUpperCase()})</h3>
                </div>

                {/* PERIODE SETTINGS */}
                <div className="card p-5 bg-white border-b border-slate-100">
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
                </div>
                
                <div className="grid grid-cols-1 gap-6 p-4 bg-slate-50">
                    {/* ${type.toUpperCase()} Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="${type === 'saifi' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'} border-b p-3">
                            <h4 className="font-bold text-sm">${type.toUpperCase()} (${type === 'saifi' ? 'Kali Padam' : 'Lama Padam'})</h4>
                            <p className="text-xs ${type === 'saifi' ? 'text-emerald-600' : 'text-blue-600'}">Satuan: ${type === 'saifi' ? 'Kali/Pelanggan' : 'Menit/Pelanggan'}</p>
                        </div>
                        <div className="p-0">
                            {/* Distribusi */}
                            <div className="border-b border-slate-200 overflow-hidden">
                                <button 
                                    type="button" 
                                    onClick={() => setIsDistribusiOpen(!isDistribusiOpen)}
                                    className="w-full bg-slate-100 p-4 flex justify-between items-center hover:bg-slate-200 transition-colors"
                                >
                                    <h5 className="font-bold text-slate-700 text-sm whitespace-nowrap">1. DISTRIBUSI</h5>
                                    <ChevronDownIcon className={\`transform transition-transform duration-300 \${isDistribusiOpen ? 'rotate-180' : ''}\`} />
                                </button>
                                <div className={\`p-4 space-y-4 transition-all duration-300 bg-white \${isDistribusiOpen ? 'block' : 'hidden'}\`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Padam Tidak Terencana</label>
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(\`${type}_distribusi_padam_tidak_terencana\`)} 
                                            className="w-full sm:w-2/3 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"
                                            placeholder="0.00" 
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Padam Terencana</label>
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(\`${type}_distribusi_padam_terencana\`)} 
                                            className="w-full sm:w-2/3 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"
                                            placeholder="0.00" 
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Bencana Alam</label>
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(\`${type}_distribusi_bencana_alam\`)} 
                                            className="w-full sm:w-2/3 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"
                                            placeholder="0.00" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Transmisi */}
                            <div className="border-b border-slate-200 overflow-hidden bg-white">
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <label className="font-bold text-slate-700 text-sm whitespace-nowrap">2. TRANSMISI</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        {...register(\`${type}_transmisi\`)} 
                                        className="w-full sm:w-2/3 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>

                            {/* Pembangkit */}
                            <div className="overflow-hidden bg-white">
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <label className="font-bold text-slate-700 text-sm whitespace-nowrap">3. PEMBANGKIT</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        {...register(\`${type}_pembangkit\`)} 
                                        className="w-full sm:w-2/3 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300"
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            )}`;

['saifi', 'saidi'].forEach(type => {
    let mod = type === 'saifi' ? 'InputSaifi' : 'InputKinerja';
    let p = `c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/${mod}/index.jsx`;
    let content = fs.readFileSync(p, 'utf8');

    if(!content.includes('isDistribusiOpen')) {
        content = content.replace(/const \[success, setSuccess\] = useState\(false\);/, 'const [success, setSuccess] = useState(false);\n  const [isDistribusiOpen, setIsDistribusiOpen] = useState(false);');
    }

    const startStr = '{/* Jaringan Layout */}';
    const endStr = '{/* Non-Jaringan Layout */}';
    
    let parts = content.split(startStr);
    if(parts.length > 1) {
        let after = parts[1].split(endStr);
        content = parts[0] + createJaringanBlock(type) + "\n\n            " + endStr + after[1];
    }

    let title = type === 'saifi' ? 'Realisasi SAIFI' : 'Realisasi SAIDI';
    let oldHeaderBlock = content.match(/<div className="flex items-center gap-5">[\s\S]*?<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">[\s\S]*?<\/h1>\s*<\/div>/);
    if(oldHeaderBlock) {
        let newHeaderBlock = `<div className="flex items-center gap-5">
            <button 
                type="button"
                onClick={() => navigate(bidang === 'jaringan' ? '/${type}' : '/${type}')} 
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
          content = content.replace(/<div className="flex items-center gap-5">\s*<button[\s\S]*?<\/button>\s*<div>\s*<h1[\s\S]*?<\/h1>\s*<\/div>\s*<\/div>/, newHeaderBlock);
    }
    
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
    content = content.replace(/<button\s*type="submit"\s*disabled=\{[\s\S]*?\}\s*className="[\s\S]*?w-full flex items-center justify-center gap-2[\s\S]*?<\/button>/, newBtn);

    if(!content.includes('function ChevronDownIcon')) {
        content += "\n// Icons\nfunction ChevronDownIcon({ className = \"\" }) {\n    return <svg className={className} width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"3\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>;\n}\n";
    } else {
        content = content.replace(/function ChevronDownIcon\(\)\s*\{/, 'function ChevronDownIcon({ className = "" }) {');
        content = content.replace(/<svg width="20"/, '<svg className={className} width="20"');
    }

    fs.writeFileSync(p, content);
});
