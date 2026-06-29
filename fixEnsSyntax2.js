const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let content = fs.readFileSync(ensPath, 'utf8');

const badEnd = `          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon()`;

const goodEnd = `          </div>
        </div>
      </div>
  );
}

function ChevronDownIcon()`;

content = content.replace(badEnd, goodEnd);

fs.writeFileSync(ensPath, content);
console.log('Fixed JSX syntax perfectly again!');
