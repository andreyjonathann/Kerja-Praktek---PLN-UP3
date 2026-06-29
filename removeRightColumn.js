const fs = require('fs');
const path = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputKinerja/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove the Right Column entirely
const rightColumnStart = content.indexOf('{/* RIGHT COLUMN: Target & Live Total Widget */}');
if (rightColumnStart !== -1) {
    // Find the end of the right column block. It ends with a `</div>` before the two closing `</div>`s of the main layout.
    // Let's just find the closing `</div>\n      </div>\n    </div>\n  );\n}`
    
    const endStr = '        </div>\n      </div>\n    </div>\n  );\n}';
    const rightColumnEnd = content.lastIndexOf('</div>', content.indexOf(endStr));
    
    // Actually, it's easier to just use a regex for the wrapper
    // The wrapper is <div className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0 space-y-6">
    // and ends before </div>\n      </div>\n    </div>\n  );\n}
    const endTagIndex = content.indexOf('      </div>\n    </div>\n  );\n}');
    if (endTagIndex !== -1) {
        content = content.substring(0, rightColumnStart) + content.substring(endTagIndex);
    }
}

// 2. Change the layout container to take full width up to max-w-7xl or w-full
content = content.replace(
    /<div className="flex-1 w-full max-w-5xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-8">/,
    '<div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">'
);

fs.writeFileSync(path, content);
console.log('Modified InputKinerja');
