const fs = require('fs');

function refactorPage(filePath, titlePrefix) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add KinerjaDetailModal import if not exists
    if (!content.includes('KinerjaDetailModal')) {
        // Insert after PageHeader or DataTable imports
        content = content.replace(
            /import DataTable from '@\/components\/ui\/DataTable';/g,
            "import DataTable from '@/components/ui/DataTable';\nimport KinerjaDetailModal from '@/components/ui/KinerjaDetailModal';"
        );
    }

    // 2. Add state for modal
    if (!content.includes('selectedRow')) {
        content = content.replace(
            /const \[tab, setTab\] = useState\('monthly'\);/g,
            "const [tab, setTab] = useState('monthly');\n  const [selectedRow, setSelectedRow] = useState(null);\n  const [isModalOpen, setIsModalOpen] = useState(false);"
        );
    }

    // 3. Update columns array to only include Bulan, Target, Realisasi
    // We can do this via regex matching the `columns={[` block
    // Actually, simpler to just replace the whole columns block
    const oldColumnsRegex = /columns=\{\[\s*\{\s*key:\s*'label'.*?\}\s*\]\}/s;
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
    
    content = content.replace(oldColumnsRegex, newColumns);

    // 4. Add KinerjaDetailModal component before the final closing div
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
  );
}`;
        content = content.replace(/    <\/div>\s*<\/div>\s*\);\s*}\s*$/s, "    </div>\n" + modalJSX);
    }

    fs.writeFileSync(filePath, content);
    console.log('Refactored ' + titlePrefix);
}

refactorPage('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx', 'SAIDI');
refactorPage('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx', 'SAIFI');
refactorPage('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Ens/index.jsx', 'ENS');

