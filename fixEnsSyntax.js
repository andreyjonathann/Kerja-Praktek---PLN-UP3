const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let content = fs.readFileSync(ensPath, 'utf8');

// We have too many closing divs at the bottom.
// Currently it ends with:
/*
          </div>
        </div>

      </div>
    </div>
  );
}
*/
// The detailKomponen part ends with:
/*
            </div>

          </div>
*/

// Let's replace the bottom with just the correct two closing divs and the ChevronDownIcon function.

const badEnd = `          </div>
        </div>

      </div>
    </div>
  );
}`;

const goodEnd = `      </div>
    </div>
  );
}

function ChevronDownIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
}`;

content = content.replace(badEnd, goodEnd);

fs.writeFileSync(ensPath, content);
console.log('Fixed syntax error in InputEns!');
