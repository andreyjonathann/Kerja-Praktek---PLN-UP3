const fs = require('fs'); 
const lines = fs.readFileSync('C:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputGangguanSwitching/index.jsx', 'utf8').split('\n'); 
let open=0; 
for(let i=0; i<lines.length; i++){ 
  const o = (lines[i].match(/<div[^>]*>/g)||[]).length; 
  const c = (lines[i].match(/<\/div>/g)||[]).length; 
  open += (o - c); 
  if (o!==c) console.log(`Line ${i+1}: open=${o} close=${c} totalOpen=${open}`); 
}
