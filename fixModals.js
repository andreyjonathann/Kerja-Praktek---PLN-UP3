const fs = require('fs');

function addModal(file, titlePrefix) {
  let content = fs.readFileSync(file, 'utf8');
  
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
}`;
    // Replace the final closing div and export block
    content = content.replace(/    <\/div>\s*<\/div>\s*\)\s*}\s*$/s, "    </div>\n" + modalJSX);
    
    // Also make sure to import KinerjaDetailModal
    if (!content.includes('KinerjaDetailModal')) {
       content = content.replace(
         /import DataTable from '@\/components\/ui\/DataTable'/g,
         "import DataTable from '@/components/ui/DataTable'\nimport KinerjaDetailModal from '@/components/ui/KinerjaDetailModal'"
       );
    }
    
    fs.writeFileSync(file, content);
    console.log("Added modal to " + file);
  }
}

addModal('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx', 'SAIDI');
addModal('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx', 'SAIFI');
