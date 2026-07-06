const fs = require('fs');

const ALERT_JSX = `
          {isDuplicate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontWeight: 600, fontSize: '0.86rem',
              marginBottom: 8
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Data untuk periode ini sudah ada. Tidak dapat menginput data baru. Gunakan fitur Edit untuk mengubah data.
            </div>
          )}
`;

// ===== SAIFI =====
{
  let c = fs.readFileSync('Frontend/src/pages/InputSaifi/index.jsx', 'utf8');

  // 1. Add isDuplicate guard in onSubmit
  c = c.replace(
    `  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/kinerja/jaringan', data);`,
    `  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    if (isDuplicate) {
      alert('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      setLoading(false);
      return;
    }
    try {
      await api.post('/kinerja/jaringan', data);`
  );

  // 2. Replace the small text notif with alert box
  c = c.replace(
    `            {isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}`,
    ALERT_JSX.trim()
  );

  // 3. Update button text  
  c = c.replace(
    '                  Simpan Realisasi\r\n               </button>',
    '                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}\r\n               </button>'
  );
  c = c.replace(
    '                  Simpan Realisasi\n               </button>',
    '                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}\n               </button>'
  );

  fs.writeFileSync('Frontend/src/pages/InputSaifi/index.jsx', c);
  console.log('Fixed InputSaifi OK');
}

// ===== SAIDI =====
{
  let c = fs.readFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', 'utf8');

  // 1. Add isDuplicate guard in onSubmit
  c = c.replace(
    `  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/kinerja/jaringan', data);`,
    `  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    if (isDuplicate) {
      alert('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      setLoading(false);
      return;
    }
    try {
      await api.post('/kinerja/jaringan', data);`
  );

  // 2. Replace small text notif
  c = c.replace(
    `            {isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}`,
    ALERT_JSX.trim()
  );

  // 3. Update button text
  c = c.replace(
    '                  Simpan Realisasi\r\n               </button>',
    '                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}\r\n               </button>'
  );
  c = c.replace(
    '                  Simpan Realisasi\n               </button>',
    '                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}\n               </button>'
  );

  fs.writeFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', c);
  console.log('Fixed InputKinerjaSaidi OK');
}

// ===== ENS =====
{
  let c = fs.readFileSync('Frontend/src/pages/InputEns/index.jsx', 'utf8');

  // ENS already has isDuplicate guard in onSubmit, check if alert box exists
  if (!c.includes('fef2f2')) {
    // Find where to insert alert — after success block, before "PERIODE SETTINGS" or before form
    // Insert before the "PILIH PERIODE" section header
    c = c.replace(
      `          {/* PERIODE SETTINGS */}`,
      ALERT_JSX + `          {/* PERIODE SETTINGS */}`
    );
    console.log('Added alert to ENS');
  }

  fs.writeFileSync('Frontend/src/pages/InputEns/index.jsx', c);
  console.log('Fixed InputEns OK');
}

console.log('All done!');
