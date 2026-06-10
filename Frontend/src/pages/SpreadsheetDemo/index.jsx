import React, { useState } from 'react';
import SpreadsheetWidget from '@/components/ui/SpreadsheetWidget';
import { Database, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function SpreadsheetDemo() {
  // Gunakan URL CSV dari spreadsheet user
  const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vQF3eNDzC3vf9FXeLWl8quvpRk9UopQABmqH05jXu2CxMrqUvju_XYFuNUbvhpXdw/pub?output=csv');
  const [activeUrl, setActiveUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vQF3eNDzC3vf9FXeLWl8quvpRk9UopQABmqH05jXu2CxMrqUvju_XYFuNUbvhpXdw/pub?output=csv');

  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveUrl(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div
          className="icon-wrapper-interactive"
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
            border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 4, flexShrink: 0,
          }}
        >
          <FileSpreadsheet size={16} style={{ color: '#10B981' }} />
        </div>
        <div>
          <h1 className="page-heading" style={{ marginBottom: 4 }}>
            Integrasi Google Spreadsheet
          </h1>
          <p className="page-description">
            Demo ini menunjukkan bagaimana data diambil langsung (live) dari Google Sheets tanpa memerlukan backend database terpisah.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              URL CSV Spreadsheet (Publish to Web)
            </label>
            <div style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Masukkan link CSV Google Sheets di sini..."
                className="input"
                style={{ flex: 1, minWidth: 280, height: 40, fontSize: '0.875rem' }}
              />
              <button type="submit" className="btn-primary" style={{ height: 40, borderRadius: 10, fontSize: '0.85rem', padding: '0 20px', whiteSpace: 'nowrap', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={15} style={{ color: '#FFFFFF' }} /> Tarik Data
              </button>
            </div>
          </div>
        </form>
        
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 10,
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2563EB', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={15} /> Cara Mendapatkan Link CSV
          </h4>
          <ol style={{ listStyle: 'decimal', paddingLeft: 16, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Buka Google Spreadsheet Anda.</li>
            <li>Klik menu <strong>File</strong> &gt; <strong>Bagikan</strong> &gt; <strong>Publikasikan di web</strong>.</li>
            <li>Di tab Tautkan, pilih sheet yang diinginkan, dan ubah format "Halaman Web" menjadi <strong>Nilai yang dipisahkan koma (.csv)</strong>.</li>
            <li>Klik Publikasikan, lalu salin link yang muncul dan tempelkan di atas.</li>
          </ol>
        </div>
      </div>

      {activeUrl ? (
        <SpreadsheetWidget csvUrl={activeUrl} title="Data Live dari Spreadsheet" />
      ) : (
        <div className="card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
          <FileSpreadsheet size={48} style={{ color: 'var(--border-strong)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.875rem' }}>Klik "Tarik Data" untuk menampilkan sampel, <br/>atau masukkan link CSV Anda sendiri.</p>
        </div>
      )}
    </div>
  );
}
