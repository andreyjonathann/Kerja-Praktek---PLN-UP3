const fs = require('fs');

let c = fs.readFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', 'utf8');

c = c.replace(/Saifi/g, 'KinerjaSaidi');
c = c.replace(/saifi/g, 'saidi');
c = c.replace(/SAIFI/g, 'SAIDI');
c = c.replace('Kali/Pelanggan', 'Jam/Pelanggan');
c = c.replace(
  'Simpan Realisasi\\n               </button>', 
  '{isDuplicate ? "Data Sudah Ada" : "Simpan Realisasi"}\\n               </button>'
);

fs.writeFileSync('Frontend/src/pages/InputKinerjaSaidi/index.jsx', c);
