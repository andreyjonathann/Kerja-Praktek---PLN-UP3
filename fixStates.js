const fs = require('fs');

const pages = [
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saidi/index.jsx',
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx',
  'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Ens/index.jsx'
];

pages.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('selectedRow')) {
    // Find where setTab is
    content = content.replace(
      /const \[tab,\s*setTab\]\s*=\s*useState\('monthly'\)[^\n]*/g,
      "$& \n  const [selectedRow, setSelectedRow] = useState(null);\n  const [isModalOpen, setIsModalOpen] = useState(false);"
    );
    fs.writeFileSync(filePath, content);
    console.log("Fixed " + filePath);
  }
});
