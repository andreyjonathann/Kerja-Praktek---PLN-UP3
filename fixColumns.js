const fs = require('fs');

const newColumns = `columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v?.toFixed(3) ?? '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center',
              render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{v.toFixed(3)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> }
          ]}
          onRowClick={(row) => {
            setSelectedRow(row);
            setIsModalOpen(true);
          }}`;

const files = [
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx',
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx',
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Ens/index.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the exact columns block
  const startIdx = content.indexOf('columns={[');
  const dataIdx = content.indexOf('data={data}', startIdx);
  
  if (startIdx !== -1 && dataIdx !== -1) {
    const originalColumnsBlock = content.substring(startIdx, dataIdx);
    content = content.replace(originalColumnsBlock, newColumns + '\n          ');
    fs.writeFileSync(file, content);
    console.log("Fixed columns in " + file);
  }
});
