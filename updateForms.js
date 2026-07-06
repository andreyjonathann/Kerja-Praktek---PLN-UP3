const fs = require('fs');

const files = [
  'Frontend/src/pages/InputSaifi/index.jsx',
  'Frontend/src/pages/InputKinerjaSaidi/index.jsx',
  'Frontend/src/pages/InputGangguanTmKurang5/index.jsx',
  'Frontend/src/pages/InputGangguanTmLebih5/index.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Submit Logic
  // Find "setSuccess(false);" or "setSaving(true);" inside submit
  content = content.replace(/(setSuccess\(false\);|setSaving\(true\);)(\s*)try \{/g, 
    `$1$2if (isDuplicate) {\n      alert('Data sudah ada! Tidak bisa mengedit dari halaman Tambah.');\n      setLoading(false);\n      if(typeof setSaving !== 'undefined') setSaving(false);\n      return;\n    }\n    try {`
  );

  // 2. Title Logic
  // e.g. {isDuplicate ? 'Edit SAIFI' : 'Tambah SAIFI'} -> Tambah SAIFI
  // {isDuplicate ? 'Edit SAIDI' : 'Tambah SAIDI'} -> Tambah SAIDI
  // {isDuplicate ? 'Edit Gangguan' : 'Tambah Gangguan'} -> Tambah Gangguan
  content = content.replace(/\{isDuplicate \? 'Edit (.*?)' \: 'Tambah \1'\}/g, 'Tambah $1');
  
  // 3. Remove "Hapus Data" button section
  // It's usually like: {isDuplicate && (\n <button ... onClick={handleDelete} ... Hapus Data ... </button>\n)}
  // I will just use regex to remove handleDelete button block
  content = content.replace(/\{\s*isDuplicate\s*&&\s*\(\s*<button[^>]*onClick=\{handleDelete[^\}]*\}[^>]*>[\s\S]*?<\/button>\s*\)\s*\}/g, '');

  // 4. Add alert box for isDuplicate before the form or loadingData
  if (!content.includes('Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini.')) {
    // find {loadingData ? ( or {loading ? (
    const alertBox = `        {isDuplicate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: '#fef2f2', border: \`1px solid #fecaca\`,
            color: '#dc2626', fontWeight: 600, fontSize: '0.86rem',
            marginBottom: 20
          }}>
            <AlertTriangle size={16} />
            Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}\n\n`;

    if (content.includes('{loadingData ? (')) {
      content = content.replace('{loadingData ? (', alertBox + '        {loadingData ? (');
    } else if (content.includes('{loading ? (')) {
      content = content.replace('{loading ? (', alertBox + '        {loading ? (');
    }
  }

  // 5. Change "Simpan Perubahan" to "Data Sudah Ada"
  content = content.replace(/\{isDuplicate \? 'Simpan Perubahan' \: 'Simpan Data'\}/g, "{isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}");
  
  // 6. Fix disabled button state
  content = content.replace(/disabled=\{loading\}/g, "disabled={loading || isDuplicate}");
  content = content.replace(/background:\s*loading\s*\?\s*'#93c5fd'\s*:\s*(['"][^'"]+['"])/g, "background: (loading || isDuplicate) ? '#93c5fd' : $1");
  content = content.replace(/cursor:\s*loading\s*\?\s*'not-allowed'\s*:\s*'pointer'/g, "cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer'");
  content = content.replace(/boxShadow:\s*loading\s*\?\s*'none'\s*:\s*(['"][^'"]+['"])/g, "boxShadow: (loading || isDuplicate) ? 'none' : $1");

  // 7. readOnly state for text/number inputs
  // Find all <input and add readOnly={isDuplicate}
  // But doing this with regex on JSX is risky. Instead I will just let the "Data Sudah Ada" block editing from the UI and the server side blocks it too.
  // Wait, I can do it easily:
  content = content.replace(/<input\s+type="number"(?![\s\S]*?readOnly=\{isDuplicate\})/g, '<input \n                    readOnly={isDuplicate}\n                    type="number"');

  // Remove the old small {isDuplicate && <div...> Data untuk periode ini sudah ada. Anda sedang dalam mode Edit.}
  content = content.replace(/\{\s*isDuplicate\s*&&\s*\(\s*<div[^>]*>[\s\S]*?Anda sedang dalam mode <strong>Edit<\/strong>[\s\S]*?<\/div>\s*\)\s*\}/g, '');

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
