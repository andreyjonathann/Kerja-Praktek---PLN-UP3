
const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.includes('Input') && file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}
const files = walk('./Frontend/src/pages');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace select class
    let selectRegex = /className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500\/10 focus:border-blue-500 transition-all font-bold cursor-pointer appearance-none shadow-sm text-slate-700"/g;
    content = content.replace(selectRegex, 'className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-slate-500"');

    // Replace input class
    let inputRegex = /className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500\/10 focus:border-blue-500"/g;
    content = content.replace(inputRegex, 'className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"');

    fs.writeFileSync(file, content);
    if(original !== content) console.log('Modified', file);
})

