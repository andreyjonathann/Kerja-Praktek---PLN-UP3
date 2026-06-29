const fs = require('fs');

function applyTableChanges(file, titlePrefix) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add KinerjaDetailModal import
  if (!content.includes('KinerjaDetailModal')) {
    const importStr = "import DataTable from '@/components/ui/DataTable'";
    content = content.replace(importStr, importStr + "\nimport KinerjaDetailModal from '@/components/ui/KinerjaDetailModal'");
  }

  // 2. Add states
  if (!content.includes('selectedRow')) {
    // Find setTab line
    const setTabRegex = /const \[tab,\s*setTab\]\s*=\s*useState\('monthly'\)[^\n]*\n/;
    content = content.replace(
      setTabRegex,
      "$&  const [selectedRow, setSelectedRow] = useState(null);\n  const [isModalOpen, setIsModalOpen] = useState(false);\n"
    );
  }

  // 3. Replace columns
  const startIdx = content.indexOf('columns={[');
  const dataIdx = content.indexOf('data={', startIdx);
  
  if (startIdx !== -1 && dataIdx !== -1) {
    const isSaifi = titlePrefix === 'SAIFI';
    const numFormatter = isSaifi ? 'Number(v).toFixed(4)' : 'v?.toFixed(3)';
    
    const newColumns = `columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? ${numFormatter} : '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={\`font-bold \${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}\`}>{${numFormatter}}</span> : <span className="text-slate-400 text-xs font-bold">-</span> }
          ]}
          onRowClick={(row) => {
            setSelectedRow(row);
            setIsModalOpen(true);
          }}
          `;
    const originalColumnsBlock = content.substring(startIdx, dataIdx);
    content = content.replace(originalColumnsBlock, newColumns);
  }

  // 4. Inject Modal
  if (!content.includes('<KinerjaDetailModal')) {
    const modalJSX = `
      <KinerjaDetailModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        titlePrefix="${titlePrefix}"
        isCumulative={tab === 'cumulative'}
      />
    </div>
  )
}
`;
    // Replace the end
    content = content.replace(/    <\/div>\s*<\/div>\s*\)\s*}\s*$/s, "    </div>\n" + modalJSX);
  }

  fs.writeFileSync(file, content);
  console.log("Successfully applied changes to " + file);
}

applyTableChanges('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx', 'SAIDI');
applyTableChanges('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx', 'SAIFI');
