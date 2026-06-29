const fs = require('fs');

function updateSaidi() {
    const path = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';
    let content = fs.readFileSync(path, 'utf8');

    // 1. Change layout wrapper to match ENS
    content = content.replace(
        '<div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">',
        '<div className="w-full px-[32px] py-4 md:py-8">'
    );
    // Remove the `<div className="flex-1">` that wraps the form, because we deleted the right column.
    // Wait, replacing it exactly is safer:
    content = content.replace(
        '        {/* LEFT COLUMN: Main Form */}\n        <div className="flex-1">',
        '        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">'
    );

    // 2. Change the button to be solid blue instead of outlined.
    // The parent container
    content = content.replace('background: \'rgba(37, 99, 235, 0.05)\'', 'background: \'#2563eb\'');
    content = content.replace('border: \'1px solid rgba(37, 99, 235, 0.15)\'', 'border: \'none\'');

    // The button itself
    content = content.replace('background: loading ? \'#e2e8f0\' : \'var(--bg-card, #ffffff)\'', 'background: loading ? \'#93c5fd\' : \'#2563eb\'');
    content = content.replace('color: loading ? \'#64748b\' : \'#2563EB\'', 'color: \'#ffffff\'');
    content = content.replace('boxShadow: loading ? \'none\' : \'0 2px 8px rgba(37, 99, 235, 0.15)\'', 'boxShadow: loading ? \'none\' : \'0 4px 12px rgba(37, 99, 235, 0.3)\'');
    
    // The hover state
    content = content.replace('e.currentTarget.style.background = \'#2563EB\'; e.currentTarget.style.color = \'#FFFFFF\'', 'e.currentTarget.style.background = \'#1d4ed8\'; e.currentTarget.style.color = \'#ffffff\'');
    content = content.replace('e.currentTarget.style.background = \'var(--bg-card, #ffffff)\'; e.currentTarget.style.color = \'#2563EB\'', 'e.currentTarget.style.background = \'#2563eb\'; e.currentTarget.style.color = \'#ffffff\'');

    fs.writeFileSync(path, content);
}

function updateEns() {
    const path = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
    let content = fs.readFileSync(path, 'utf8');

    // Make the button solid blue too
    content = content.replace('background: \'rgba(37, 99, 235, 0.05)\'', 'background: \'#2563eb\'');
    content = content.replace('border: \'1px solid rgba(37, 99, 235, 0.15)\'', 'border: \'none\'');

    content = content.replace('background: loading ? \'#e2e8f0\' : \'var(--bg-card, #ffffff)\'', 'background: loading ? \'#93c5fd\' : \'#2563eb\'');
    content = content.replace('color: loading ? \'#64748b\' : \'#2563EB\'', 'color: \'#ffffff\'');
    content = content.replace('boxShadow: loading ? \'none\' : \'0 2px 8px rgba(37, 99, 235, 0.15)\'', 'boxShadow: loading ? \'none\' : \'0 4px 12px rgba(37, 99, 235, 0.3)\'');

    content = content.replace('e.currentTarget.style.background = \'#2563EB\';\n                       e.currentTarget.style.color = \'#FFFFFF\';', 'e.currentTarget.style.background = \'#1d4ed8\';\n                       e.currentTarget.style.color = \'#ffffff\';');
    content = content.replace('e.currentTarget.style.background = \'var(--bg-card, #ffffff)\';\n                       e.currentTarget.style.color = \'#2563EB\';', 'e.currentTarget.style.background = \'#2563eb\';\n                       e.currentTarget.style.color = \'#ffffff\';');

    fs.writeFileSync(path, content);
}

try {
    updateSaidi();
    updateEns();
    console.log("Updated both files");
} catch (e) {
    console.error(e);
}
