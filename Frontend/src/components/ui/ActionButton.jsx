import React, { useState } from 'react';

export default function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  colorHex = '#14A2BA', // default blue
  colorRgb = '0, 162, 185' // default blue RGB
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{
      display: 'inline-flex',
      background: `rgba(${colorRgb}, 0.05)`,
      padding: 4,
      borderRadius: 12,
      border: `1px solid rgba(${colorRgb}, 0.15)`,
      cursor: 'pointer'
    }}>
      <button
        onClick={onClick}
        style={{
          padding: '6px 16px',
          borderRadius: 9,
          fontSize: '0.85rem',
          fontWeight: 700,
          transition: 'all 0.2s ease',
          border: 'none',
          cursor: 'pointer',
          background: isHovered ? colorHex : 'var(--bg-card)',
          color: isHovered ? '#FFFFFF' : colorHex,
          boxShadow: `0 2px 8px rgba(${colorRgb}, 0.15)`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {Icon && <Icon size={16} />} 
        {label}
      </button>
    </div>
  );
}
