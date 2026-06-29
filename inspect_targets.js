const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.replace(/\r/g, '').split('\n');
    console.log("Targets found:");
    lines.forEach(l => {
      if (l.includes('"Target"')) {
        console.log(l);
      }
    });
  });
});
