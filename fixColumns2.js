const fs = require('fs');

const saifiColumns = `columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? Number(v).toFixed(4) : '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{Number(v).toFixed(4)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> }
          ]}
          onRowClick={(row) => {
            setSelectedRow(row);
            setIsModalOpen(true);
          }}`;

const ensColumns = `columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? Number(v).toFixed(3) : '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{Number(v).toFixed(3)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> }
          ]}
          onRowClick={(row) => {
            setSelectedRow(row);
            setIsModalOpen(true);
          }}`;


function fixFile(file, isEns) {
  let content = fs.readFileSync(file, 'utf8');
  
  const startIdx = content.indexOf('columns={[');
  
  // Find the next 'data={' after startIdx
  const dataIdx = content.indexOf('data={', startIdx);
  
  if (startIdx !== -1 && dataIdx !== -1) {
    const originalColumnsBlock = content.substring(startIdx, dataIdx);
    content = content.replace(originalColumnsBlock, (isEns ? ensColumns : saifiColumns) + '\n          ');
    fs.writeFileSync(file, content);
    console.log("Fixed columns in " + file);
  }
}

fixFile('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx', false);
fixFile('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Ens/index.jsx', true);
