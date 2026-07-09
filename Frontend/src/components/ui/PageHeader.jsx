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
      
      <div style={{
        background: 'var(--bg-card)', 
        padding: '20px 24px', 
        borderRadius: 16, 
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="icon-wrapper-interactive"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, rgba(${r},${g},${b},0.15), rgba(${r},${g},${b},0.05))`,
                  border: `1px solid rgba(${r},${g},${b},0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={18} style={{ color: iconColor }} />}
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {title}
              </h1>
            </div>
            {description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 46, margin: 0 }}>{description}</p>}
          </div>

          {children && (
            <div className="flex gap-3 mt-2 md:mt-0">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
