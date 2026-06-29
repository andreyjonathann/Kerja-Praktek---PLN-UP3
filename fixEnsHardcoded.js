const fs = require('fs');

const ensPath = 'c:/laragon/www/Kerja-Praktek---PLN-UP3/Frontend/src/pages/InputEns/index.jsx';
let ensContent = fs.readFileSync(ensPath, 'utf8');

// The top half of ENS is correct up to {/* FORM INPUTS */}
const formInputsIndex = ensContent.indexOf('{/* FORM INPUTS */}');
let topHalf = ensContent.substring(0, formInputsIndex);

const detailKomponen = `        {/* FORM INPUTS */}
          <div className="mb-6 mt-10">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={24} className="text-blue-500" />
              Detail Komponen ENS
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            
            {/* Input Row 1: Distribusi Header */}
            <div 
               className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white border-b border-[#f3f4f6] gap-4 hover:bg-slate-50/80 transition cursor-pointer"
               onClick={() => setIsDistribusiOpen(!isDistribusiOpen)}
            >
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                   <Zap size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px] cursor-pointer">Distribusi</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Klik untuk melihat detail input</p>
                 </div>
               </div>
               <div className="text-slate-400">
                 {isDistribusiOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
               </div>
            </div>

            {/* CHILD ROWS (Only shown if isDistribusiOpen) */}
            {isDistribusiOpen && (
              <div className="bg-slate-50/70 border-b border-slate-200 shadow-inner">
                {/* Input Row 1 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Padam Tidak Terencana</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('tidak_terencana')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_padam_tidak_terencana')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 2 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Padam Terencana</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('padam_terencana')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_padam_terencana')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 3 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Bencana Alam</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('bencana_alam')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_bencana_alam')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>
              </div>
            )}

            {/* Input Row 4: Transmisi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white border-b border-[#f3f4f6] gap-4 hover:bg-slate-50/50 transition">
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                   <RadioTower size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px]">Transmisi</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('transmisi')}</p>
                 </div>
               </div>
               <div className="relative w-full md:w-64">
                 <input 
                    type="number" step="0.0001" 
                    {...register('transmisi')} 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                    placeholder="-" 
                 />
               </div>
            </div>

            {/* Input Row 5: Pembangkit */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white gap-4 hover:bg-slate-50/50 transition">
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                   <Factory size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px]">Pembangkit</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('pembangkit')}</p>
                 </div>
               </div>
               <div className="relative w-full md:w-64">
                 <input 
                    type="number" step="0.0001" 
                    {...register('pembangkit')} 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                    placeholder="-" 
                 />
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync(ensPath, topHalf + detailKomponen);
console.log('Successfully injected exact hardcoded detail komponen into ENS.');
