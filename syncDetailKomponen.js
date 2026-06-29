const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
const kinerjaPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';

let ensContent = fs.readFileSync(ensPath, 'utf8');
let kinerjaContent = fs.readFileSync(kinerjaPath, 'utf8');

const startTag = '<div className="mb-6 mt-10">';
const endTag = '          </div>\n        </div>\n\n      </div>\n    </div>\n  );\n}';

const kinerjaStart = kinerjaContent.indexOf(startTag);
const kinerjaEnd = kinerjaContent.indexOf(endTag) + '          </div>\n        </div>'.length;

let detailKomponen = kinerjaContent.substring(kinerjaStart, kinerjaEnd);

// Make detailKomponen ENS-specific
detailKomponen = detailKomponen.replace(/Detail Komponen SAIDI/g, 'Detail Komponen ENS');
detailKomponen = detailKomponen.replace(/saidi_/g, '');
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_padam_tidak_terencana'\)/g, "getPrevMonthValue('tidak_terencana')");
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_padam_terencana'\)/g, "getPrevMonthValue('padam_terencana')");
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_bencana_alam'\)/g, "getPrevMonthValue('bencana_alam')");

const ensStart = ensContent.indexOf(startTag);
const ensEnd = ensContent.indexOf(endTag) + '          </div>\n        </div>'.length;

ensContent = ensContent.substring(0, ensStart) + detailKomponen + ensContent.substring(ensEnd);

fs.writeFileSync(ensPath, ensContent);
console.log('Successfully synced Detail Komponen ENS with SAIDI.');
