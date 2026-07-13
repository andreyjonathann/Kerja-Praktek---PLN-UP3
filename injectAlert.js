const fs = require('fs');

const files = [
  'Frontend/src/pages/InputKinerjaSaidi/index.jsx',
  'Frontend/src/pages/InputGangguanTmKurang5/index.jsx',
  'Frontend/src/pages/InputGangguanTmLebih5/index.jsx'
];

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
        )}
`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Insert alert box just before <form
  if (!content.includes('Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini.')) {
    content = content.replace(/<form\s/, alertBox + '\n        <form ');
  }
  
  // Make sure we have AlertTriangle imported
  if (!content.includes('AlertTriangle')) {
    content = content.replace(/import \{([^}]+)\}\s+from\s+['"]lucide-react['"];/, (match, p1) => {
      return `import {${p1}, AlertTriangle} from 'lucide-react';`;
    });
  }

  // Double check the {isDuplicate ? 'Edit' : 'Tambah'} -> Tambah
  content = content.replace(/\{isDuplicate \? 'Edit (.*?)' \: 'Tambah \1'\}/g, 'Tambah $1');

  fs.writeFileSync(file, content);
  console.log('Injected alert to ' + file);
}
