const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
const kinerjaPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';

let ensContent = fs.readFileSync(ensPath, 'utf8');
let kinerjaContent = fs.readFileSync(kinerjaPath, 'utf8');

// The top half of ENS is correct up to {/* FORM INPUTS */}
const formInputsIndex = ensContent.indexOf('{/* FORM INPUTS */}');
let topHalf = ensContent.substring(0, formInputsIndex);

// We extract the Detail Komponen from InputKinerja
const startTag = '<div className="mb-6 mt-10">';
const endTag = '          </div>\n        </div>\n\n      </div>\n    </div>\n  );\n}';
const kinerjaStart = kinerjaContent.indexOf(startTag);
const kinerjaEnd = kinerjaContent.indexOf(endTag);

let detailKomponen = kinerjaContent.substring(kinerjaStart, kinerjaEnd);

// Clean up detailKomponen for ENS
detailKomponen = detailKomponen.replace(/Detail Komponen SAIDI/g, 'Detail Komponen ENS');
detailKomponen = detailKomponen.replace(/saidi_/g, '');
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_padam_tidak_terencana'\)/g, "getPrevMonthValue('tidak_terencana')");
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_padam_terencana'\)/g, "getPrevMonthValue('padam_terencana')");
detailKomponen = detailKomponen.replace(/getPrevMonthValue\('distribusi_bencana_alam'\)/g, "getPrevMonthValue('bencana_alam')");

// Now we construct the final ENS content:
// topHalf + "\n        {/* FORM INPUTS */}\n        " + detailKomponen + closing tags
const finalContent = topHalf + "{/* FORM INPUTS */}\n        " + detailKomponen + "        </div>\n\n      </div>\n    </div>\n  );\n}\n";

fs.writeFileSync(ensPath, finalContent);
console.log('Fixed InputEns/index.jsx!');
