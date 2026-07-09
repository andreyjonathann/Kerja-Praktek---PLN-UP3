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
    <div className="animate-fade-in py-4">
      {backTo && (
        <button 
            onClick={() => navigate(backTo)}
            className="flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
            <ArrowLeft size={15} className="mr-1.5" /> KEMBALI
        </button>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="icon-wrapper-interactive"
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: `linear-gradient(135deg, rgba(${r},${g},${b},0.2), rgba(${r},${g},${b},0.08))`,
                border: `1px solid rgba(${r},${g},${b},0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {Icon && <Icon size={14} style={{ color: iconColor }} />}
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
          </div>
          {description && <p className="text-xs text-slate-500 ml-9">{description}</p>}
        </div>

        {children && (
          <div className="flex gap-3 mt-2 md:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
