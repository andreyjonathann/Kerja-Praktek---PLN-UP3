const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.replace(/\r/g, '').split('\n');
    console.log("Total lines:", lines.length);
    console.log("Header line:", lines[0]);
    console.log("First 20 lines:");
    console.log(lines.slice(0, 20).join('\n'));
    console.log("\nUnique first column values:");
    const firstCols = new Set(lines.map(l => l.split(',')[0]));
    console.log([...firstCols]);
  });
});
