import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const icons = {
    error: <AlertCircle size={20} style={{ color: '#EF4444' }} />,
    success: <CheckCircle size={20} style={{ color: '#22C55E' }} />,
    info: <Info size={20} style={{ color: '#3B82F6' }} />,
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12, border: '1px solid',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      animation: 'slideUp 0.3s ease-out forwards',
      ...(type === 'error' ? { background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' } : {}),
      ...(type === 'success' ? { background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' } : {}),
      ...(type === 'info' ? { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E40AF' } : {})
    }}>
      {icons[type]}
      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, marginRight: 8 }}>{message}</p>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
        color: 'inherit', opacity: 0.7
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
