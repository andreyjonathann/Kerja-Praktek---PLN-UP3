const fs = require('fs');
fetch('https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA')
  .then(r => r.text())
  .then(t => {
    const lines = t.split('\n');
    const years = new Set();
    lines.forEach(l => {
      const p = l.split(',');
      if (p.length > 2 && p[2]) years.add(p[2].replace(/"/g, ''));
    });
    console.log([...years].join(', '));
  });
