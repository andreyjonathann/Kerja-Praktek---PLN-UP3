const fs = require('fs');

const file = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/Saifi/index.jsx';
let c = fs.readFileSync(file, 'utf8');

// Fix double spacing before paginated
c = c.replace(`          data={data}\n                    paginated={false}`, `          data={data}\n          paginated={false}`);

// Add KinerjaDetailModal JSX before the closing divs
c = c.replace(
  `      </div>\r\n    </div>\r\n  )\r\n}\r\n`,
  `      </div>

      <KinerjaDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        titlePrefix="SAIFI"
        isCumulative={tab === 'cumulative'}
        year={filters.year}
        onDeleteSuccess={fetchData}
      />
    </div>
  )
}
`
);

fs.writeFileSync(file, c, 'utf8');
console.log('Done — last', c.length, 'bytes');
console.log(c.substring(c.length - 500));
