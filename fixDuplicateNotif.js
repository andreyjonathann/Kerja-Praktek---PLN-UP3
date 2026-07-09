const fs = require('fs');

const ALERT_BOX = `          {isDuplicate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontWeight: 600, fontSize: '0.86rem',
              marginBottom: 4
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Data untuk periode ini sudah ada. Tidak dapat menginput data baru. Gunakan fitur Edit untuk mengubah data.
            </div>
          )}`;

// --- SAIFI ---
{
  let c = fs.readFileSync('Frontend/src/pages/InputSaifi/index.jsx', 'utf8');

  // 1. Upgrade the small text notif to a proper alert box
  c = c.replace(
    `{isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}`,
    ALERT_BOX
  );

  // 2. Update button text
  c = c.replace(
    /(\{loading \? <div[^>]+><\/div> : <Save[^\/]*\/>})\s*Simpan Realisasi/,
    '$1\n                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}'
  );

  // 3. Import AlertTriangle if not present
  if (!c.includes('AlertTriangle')) {
    c = c.replace("import { Activity,", "import { Activity, AlertTriangle,");
  }

  fs.writeFileSync('Frontend/src/pages/InputSaifi/index.jsx', c);
  console.log('Fixed InputSaifi');
}

// --- SAIDI ---
{
  let c = fs.readFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', 'utf8');

  c = c.replace(
    `{isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}`,
    ALERT_BOX
  );

  c = c.replace(
    /(\{loading \? <div[^>]+><\/div> : <Save[^\/]*\/>})\s*Simpan Realisasi/,
    '$1\n                  {isDuplicate ? \'Data Sudah Ada\' : \'Simpan Realisasi\'}'
  );

  if (!c.includes('AlertTriangle')) {
    c = c.replace("import { Activity,", "import { Activity, AlertTriangle,");
  }

  fs.writeFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', c);
  console.log('Fixed InputKinerjaSaidi');
}

// --- ENS ---
{
  let c = fs.readFileSync('Frontend/src/pages/InputEns/index.jsx', 'utf8');

  // Find the existing isDuplicate notification and upgrade it
  // Check if there's already a box-style notification
  if (!c.includes('fef2f2') && c.includes('{isDuplicate && (')) {
    // Replace existing small text with box
    c = c.replace(
      /{isDuplicate && \(\s*<p[^>]*>[^<]*<\/p>\s*\)}/s,
      ALERT_BOX
    );
    console.log('Replaced ENS small notif with box');
  } else if (!c.includes('fef2f2')) {
    // Insert after success block - find the success block end
    console.log('ENS: could not find isDuplicate notification spot');
  }

  fs.writeFileSync('Frontend/src/pages/InputEns/index.jsx', c);
  console.log('Fixed InputEns');
}

console.log('All done!');
