import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message = "Gagal memuat data. Silakan muat ulang.", onRetry }) {
  return (
    <div style={{
      background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertCircle size={24} style={{ color: '#EF4444' }} />
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#991B1B', margin: 0 }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#FEE2E2', color: '#B91C1C',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FECACA'}
          onMouseLeave={e => e.currentTarget.style.background = '#FEE2E2'}
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      )}
    </div>
  );
}
