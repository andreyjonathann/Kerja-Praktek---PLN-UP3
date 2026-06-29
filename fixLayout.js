const fs = require('fs');
['InputSaifi', 'InputKinerja'].forEach(mod => {
    let p = `c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/${mod}/index.jsx`;
    let c = fs.readFileSync(p, 'utf8');

    c = c.replace(/<div className="flex items-center justify-between">\s*<label className="text-xs font-bold text-slate-600 w-1\/2 uppercase">Padam Tidak Terencana<\/label>/g, 
        '<div className="flex items-center justify-between gap-4">\n                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Padam Tidak Terencana</label>');
    c = c.replace(/<div className="flex items-center justify-between">\s*<label className="text-xs font-bold text-slate-600 w-1\/2 uppercase">Padam Terencana<\/label>/g, 
        '<div className="flex items-center justify-between gap-4">\n                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Padam Terencana</label>');
    c = c.replace(/<div className="flex items-center justify-between">\s*<label className="text-xs font-bold text-slate-600 w-1\/2 uppercase">Bencana Alam<\/label>/g, 
        '<div className="flex items-center justify-between gap-4">\n                                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase">Bencana Alam</label>');

    c = c.replace(/className="w-full px-5 py-4 bg-white/g, 'className="w-full sm:w-2/3 px-5 py-4 bg-white');

    c = c.replace(/<div className="flex items-center justify-between border-b border-slate-100 pb-3">\s*<label className="font-bold text-slate-700 text-sm">2\. TRANSMISI<\/label>/g, 
        '<div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 pt-2">\n                                <label className="font-bold text-slate-700 text-sm whitespace-nowrap">2. TRANSMISI</label>');
    c = c.replace(/<div className="flex items-center justify-between">\s*<label className="font-bold text-slate-700 text-sm">3\. PEMBANGKIT<\/label>/g, 
        '<div className="flex items-center justify-between gap-4 pt-2">\n                                <label className="font-bold text-slate-700 text-sm whitespace-nowrap">3. PEMBANGKIT</label>');

    // Reapply dropdown logic
    c = c.replace(/<div className="bg-slate-100 p-2 border-b border-slate-200">\s*<h5 className="font-bold text-slate-700 text-sm">1\. DISTRIBUSI<\/h5>\s*<\/div>\s*<div className="p-3 space-y-3">/,
        `<button type="button" onClick={() => setIsDistribusiOpen(!isDistribusiOpen)} className="w-full bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center hover:bg-slate-200 transition-colors"><h5 className="font-bold text-slate-700 text-sm">1. DISTRIBUSI</h5><ChevronDownIcon className={\`transform transition-transform duration-300 \${isDistribusiOpen ? 'rotate-180' : ''}\`} /></button><div className={\`p-3 space-y-3 transition-all duration-300 \${isDistribusiOpen ? 'block' : 'hidden'}\`}>`
    );

    // add state if not exist
    if(!c.includes('isDistribusiOpen')) {
        c = c.replace(/const \[success, setSuccess\] = useState\(false\);/, 'const [success, setSuccess] = useState(false);\n  const [isDistribusiOpen, setIsDistribusiOpen] = useState(false);');
    }

    // add className to chevron icon
    c = c.replace(/function ChevronDownIcon\(\) \{/, 'function ChevronDownIcon({ className = "" }) {');
    c = c.replace(/<svg width="20"/, '<svg className={className} width="20"');

    fs.writeFileSync(p, c);
});
