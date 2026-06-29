const fs = require('fs');

function fixImport(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('KinerjaDetailModal')) {
    // Find where DataTable is imported
    const searchString = "import DataTable from '@/components/ui/DataTable'";
    if (content.includes(searchString)) {
      content = content.replace(searchString, searchString + "\nimport KinerjaDetailModal from '@/components/ui/KinerjaDetailModal'");
      fs.writeFileSync(file, content);
      console.log("Fixed import in " + file);
    } else {
      console.log("Could not find DataTable import in " + file);
    }
  }
}

fixImport('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx');
fixImport('c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx');
