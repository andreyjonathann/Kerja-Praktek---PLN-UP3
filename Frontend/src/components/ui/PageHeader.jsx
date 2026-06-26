import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, description, icon: Icon, iconColor = '#3B82F6', backTo, children }) {
  const navigate = useNavigate();

  let r = 59, g = 130, b = 246;
  if (iconColor.startsWith('#')) {
      const hex = iconColor.replace('#', '');
      if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
      }
  }

  return (
    <div className="mb-6 animate-fade-in">
      {backTo && (
        <button 
            onClick={() => navigate(backTo)}
            className="flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
            <ArrowLeft size={16} className="mr-2" /> KEMBALI
        </button>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="icon-wrapper-interactive"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, rgba(\${r},\${g},\${b},0.2), rgba(\${r},\${g},\${b},0.08))`,
                border: `1px solid rgba(\${r},\${g},\${b},0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {Icon && <Icon size={16} style={{ color: iconColor }} />}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{title}</h1>
          </div>
          {description && <p className="text-slate-500 text-base">{description}</p>}
        </div>

        {children && (
          <div className="flex gap-3 mt-4 md:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
