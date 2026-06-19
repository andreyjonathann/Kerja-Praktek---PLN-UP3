const { fetchSpreadsheetData } = require('./Frontend/src/services/googleSheetsService.js');
// wait, I can't require ES modules easily in Node.
// Let's just fetch MASTER_DATA directly and find SAIDI.
const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.replace(/\r/g, '').split('\n');
    console.log(lines.filter(l => l.includes('SAIDI')).join('\n'));
  });
});
