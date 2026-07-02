import React from 'react'

/**
 * InputRow component
 * Reusable row matching the style of the Distribusi sub-item layout in Jaringan.
 * Compatible with react-hook-form (via register + name) and standard state (via value + onChange).
 */
export default function InputRow({ 
  label, 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "-", 
  step = "any", 
  register = null,
  name = "",
  plClass = "pl-6", // default left padding
  isFormattedText = false
}) {
  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    let str = val.toString();
    if (typeof val === 'number') {
      str = str.replace(/\./g, ',');
    } else {
      str = str.replace(/\./g, '');
    }
    let clean = str.replace(/[^0-9,]/g, '');
    const commaIndex = clean.indexOf(',');
    if (commaIndex !== -1) {
      const beforeComma = clean.substring(0, commaIndex).replace(/,/g, '');
      const afterComma = clean.substring(commaIndex + 1).replace(/,/g, '');
      clean = beforeComma + ',' + afterComma;
    }
    const parts = clean.split(',');
    let before = parts[0].replace(/\./g, '');
    if (before !== '') {
      before = parseInt(before, 10).toLocaleString('id-ID');
    }
    return parts.length > 1 ? before + ',' + parts[1] : before;
  }

  if (isFormattedText) {
    const displayValue = value != null && value !== '' ? formatInputSeparator(value) : '';
    return (
      <div className={`flex flex-col md:flex-row md:items-center justify-between py-[10px] px-5 ${plClass} border-b border-slate-100 gap-4 hover:bg-slate-50/50 transition duration-150`}>
         <div className="flex items-center gap-4 flex-1">
           <div>
             <label className="font-semibold text-slate-700 text-sm">{label}</label>
           </div>
         </div>
         <div className="relative flex-1 flex justify-end">
           <input 
              type="text"
              disabled={disabled}
              placeholder={placeholder}
              value={displayValue}
              onChange={(e) => {
                const rawVal = e.target.value;
                const formatted = formatInputSeparator(rawVal);
                if (onChange) onChange(formatted);
              }}
              className="w-full max-w-[180px] border border-slate-200 rounded-full bg-white px-4 py-1.5 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 text-sm font-semibold transition-all" 
           />
         </div>
      </div>
    );
  }

  const inputProps = register && name 
    ? register(name) 
    : { value: value ?? '', onChange: (e) => onChange && onChange(e.target.value) };

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between py-[10px] px-5 ${plClass} border-b border-slate-100 gap-4 hover:bg-slate-50/50 transition duration-150`}>
       <div className="flex items-center gap-4 flex-1">
         <div>
           <label className="font-semibold text-slate-700 text-sm">{label}</label>
         </div>
       </div>
       <div className="relative flex-1 flex justify-end">
         <input 
            type="number" 
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            {...inputProps}
            className="w-full max-w-[180px] border border-slate-200 rounded-full bg-white px-4 py-1.5 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 text-sm font-semibold transition-all" 
         />
       </div>
    </div>
  )
}
