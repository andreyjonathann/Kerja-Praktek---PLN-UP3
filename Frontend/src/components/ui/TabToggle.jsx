import React from 'react';

export default function TabToggle({ 
  tabs, // array of { id, label }
  activeTab, 
  onChange,
  colorHex = '#2563EB',
  colorRgb = '37, 99, 235'
}) {
  return (
    <div style={{
      display: 'inline-flex',
      background: `rgba(${colorRgb}, 0.05)`,
      padding: 4,
      borderRadius: 12,
      border: `1px solid rgba(${colorRgb}, 0.08)`,
    }}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 9,
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              color: isActive ? colorHex : 'var(--text-muted)',
              boxShadow: isActive ? `0 2px 8px rgba(${colorRgb}, 0.12)` : 'none',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
