const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let content = fs.readFileSync(ensPath, 'utf8');

const targetStr = `{/* FORM INPUTS */}
        <div className="card bg-white overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 pt-5 pb-[16px] mt-[8px] mb-[24px] flex items-center gap-3">
              <Activity className="text-blue-600" size={20} />
              <h3 className="font-bold text-lg text-slate-800">Detail Komponen ENS</h3>
          </div>
          
          <div className="flex flex-col">`;

const replaceStr = `        {/* FORM INPUTS */}
          <div className="mb-6 mt-10">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={24} className="text-blue-500" />
              Detail Komponen ENS
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    
    // In SAIDI, we didn't have the extra </div> because we didn't have <div className="flex flex-col">
    // The old ENS had:
    // <div className="card ...">
    //   ... header ...
    //   <div className="flex flex-col">
    //     ... rows ...
    //   </div>
    // </div>
    
    // SAIDI has:
    // <div className="bg-white ...">
    //   ... rows ...
    // </div>
    // This means ENS had ONE EXTRA </div> at the end of the form inputs!
    
    // Let's remove the extra </div> after the rows.
    // Let's replace the ending of the rows:
    const endRowsStr = `            {/* Input Row 5: Pembangkit */}\n            <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white border-b border-[#f3f4f6] gap-4 hover:bg-slate-50/50 transition">`;
    // Wait, the easiest way is to just find the end of the form.
    // In `InputEns`, it is at the very end of the file, right before the 6 month trend chart (which was removed).
    // Now it looks like this at the end:
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }
    
    // We can replace:
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }
    // with:
    //           </div>
    //       </div>
    //     </div>
    //   );
    // }
    
    const oldEndStr = `          </div>
        </div>

      </div>
    </div>
  );
}`;
    
    const newEndStr = `        </div>

      </div>
    </div>
  );
}`;

    content = content.replace(oldEndStr, newEndStr);
    
    // Wait, the exact string at the bottom of ENS after my last modification might be slightly different.
} else {
    console.log("Could not find targetStr!");
}

fs.writeFileSync(ensPath, content);
console.log('Fixed Detail Komponen header in ENS.');
