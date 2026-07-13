const fs = require('fs');

// ==== SAIFI ====
{
  let c = fs.readFileSync('Frontend/src/pages/InputSaifi/index.jsx', 'utf8');

  // 1. Wrap "Pilih Periode" plain section into a card
  c = c.replace(
    `          {/* PERIODE SETTINGS */}
          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
              <div className="relative w-1/2">
                  <select 
                      {...register('periode_id', { required: true })} 
                      className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                  >
                      <option value="" className="text-gray-400">Bulan</option>
                      {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={20} />
                  </div>
              </div>

              <div className="relative w-1/2">
                  <input 
                      type="number"
                      {...register('tahun', { required: true })} 
                      placeholder="Tahun"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  />
              </div>
            </div>
          </div>`,
    `          {/* PERIODE SETTINGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5">
              <div className="flex gap-4">
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Bulan</label>
                    <select 
                        {...register('periode_id', { required: true })} 
                        className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">Pilih Bulan</option>
                        {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 bottom-2.5 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tahun</label>
                    <input 
                        readOnly={isDuplicate}
                        type="number"
                        {...register('tahun', { required: true })} 
                        placeholder="Tahun"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                        style={{ background: isDuplicate ? '#f8fafc' : '#fff' }}
                    />
                </div>
              </div>
            </div>
          </div>`
  );

  // 2. Add readOnly to all inputs
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_padam_tidak_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_padam_tidak_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_padam_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_padam_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_bencana_alam')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saifi_distribusi_bencana_alam')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('saifi_transmisi')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('saifi_transmisi')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('saifi_pembangkit')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('saifi_pembangkit')}`
  );

  fs.writeFileSync('Frontend/src/pages/InputSaifi/index.jsx', c);
  console.log('SAIFI done');
}

// ==== SAIDI ====
{
  let c = fs.readFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', 'utf8');

  c = c.replace(
    `          {/* PERIODE SETTINGS */}
          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
              <div className="relative w-1/2">
                  <select 
                      {...register('periode_id', { required: true })} 
                      className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                  >
                      <option value="" className="text-gray-400">Bulan</option>
                      {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={20} />
                  </div>
              </div>

              <div className="relative w-1/2">
                  <input 
                      type="number"
                      {...register('tahun', { required: true })} 
                      placeholder="Tahun"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  />
              </div>
            </div>
          </div>`,
    `          {/* PERIODE SETTINGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5">
              <div className="flex gap-4">
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Bulan</label>
                    <select 
                        {...register('periode_id', { required: true })} 
                        className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">Pilih Bulan</option>
                        {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 bottom-2.5 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tahun</label>
                    <input 
                        readOnly={isDuplicate}
                        type="number"
                        {...register('tahun', { required: true })} 
                        placeholder="Tahun"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                        style={{ background: isDuplicate ? '#f8fafc' : '#fff' }}
                    />
                </div>
              </div>
            </div>
          </div>`
  );

  // readOnly on SAIDI inputs
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_padam_tidak_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_padam_tidak_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_padam_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_padam_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_bencana_alam')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('saidi_distribusi_bencana_alam')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('saidi_transmisi')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('saidi_transmisi')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('saidi_pembangkit')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('saidi_pembangkit')}`
  );

  fs.writeFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', c);
  console.log('SAIDI done');
}

// ==== ENS ====
{
  let c = fs.readFileSync('Frontend/src/pages/InputEns/index.jsx', 'utf8');

  c = c.replace(
    `          {/* PERIODE SETTINGS */}\r\n          <div className="mb-8 py-6">\r\n            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>\r\n            <div className="flex gap-4">\r\n              <div className="relative w-1/2">\r\n                  <select \r\n                      {...register('periode_id', { required: true })} \r\n                      className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"\r\n                  >\r\n                      <option value="" className="text-gray-400">Bulan</option>\r\n                      {MONTHS.map(m => (\r\n                      <option key={m.value} value={m.value}>{m.label}</option>\r\n                      ))}\r\n                  </select>\r\n                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">\r\n                      <ChevronDown size={20} />\r\n                  </div>\r\n              </div>\r\n              \r\n              <div className="relative w-1/2">\r\n                  <input \r\n                      type="number"\r\n                      {...register('tahun', { required: true })} \r\n                      placeholder="Tahun"\r\n                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"\r\n                  />\r\n              </div>\r\n            </div>\r\n            {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-3"><AlertCircle size={12}/> Wajib isi periode</p>}\r\n            {isDuplicate && (\r\n              <p className="text-red-500 text-sm mt-3 font-semibold">\r\n                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.\r\n              </p>\r\n            )}\r\n          </div>`,
    `          {/* PERIODE SETTINGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5">
              <div className="flex gap-4">
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Bulan</label>
                    <select 
                        {...register('periode_id', { required: true })} 
                        className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">Pilih Bulan</option>
                        {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 bottom-2.5 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
                <div className="relative w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tahun</label>
                    <input 
                        readOnly={isDuplicate}
                        type="number"
                        {...register('tahun', { required: true })} 
                        placeholder="Tahun"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                        style={{ background: isDuplicate ? '#f8fafc' : '#fff' }}
                    />
                </div>
              </div>
              {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-3"><AlertCircle size={12}/> Wajib isi periode</p>}
            </div>
          </div>`
  );

  // readOnly on ENS inputs
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('distribusi_padam_tidak_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('distribusi_padam_tidak_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('distribusi_padam_terencana')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('distribusi_padam_terencana')}`
  );
  c = c.replace(
    `                         type="number" step="0.0001" \r\n                         {...register('distribusi_bencana_alam')}`,
    `                         readOnly={isDuplicate}\r\n                         type="number" step="0.0001" \r\n                         {...register('distribusi_bencana_alam')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('transmisi')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('transmisi')}`
  );
  c = c.replace(
    `                     type="number" step="0.0001" \r\n                     {...register('pembangkit')}`,
    `                     readOnly={isDuplicate}\r\n                     type="number" step="0.0001" \r\n                     {...register('pembangkit')}`
  );

  fs.writeFileSync('Frontend/src/pages/InputEns/index.jsx', c);
  console.log('ENS done');
}

console.log('All 3 done!');
