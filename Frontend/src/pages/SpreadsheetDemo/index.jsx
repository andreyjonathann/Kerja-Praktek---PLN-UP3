import React, { useState, useEffect } from 'react';
import SpreadsheetWidget from '@/components/ui/SpreadsheetWidget';
import { Database, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SpreadsheetDemo() {
  const DEFAULT_MASTER = 'https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/edit?usp=sharing';
  
  const [urls, setUrls] = useState({
    jaringan: DEFAULT_MASTER,
    pemasaran: '',
    transaksi: '',
    anggaran: ''
  });

  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sigap_spreadsheet_urls');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // We might store CSV export URLs or the raw edit URLs, let's keep what user types
        // Actually, user types the edit url. We need to convert to CSV url on save.
        // Wait, earlier the user typed edit url, and the app converted it.
        // Let's just load the raw urls.
        setUrls(parsed.raw || {
          jaringan: parsed.jaringan || DEFAULT_MASTER,
          pemasaran: parsed.pemasaran || '',
          transaksi: parsed.transaksi || '',
          anggaran: parsed.anggaran || ''
        });
      } catch (e) {}
    }
  }, []);

  const convertToCsvUrl = (url) => {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=MASTER_DATA`;
    }
    return url;
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Save raw urls so the user sees what they typed
    const rawObj = { ...urls };
    
    // Convert to CSV urls for the backend service
    const csvObj = {
      jaringan: convertToCsvUrl(urls.jaringan),
      pemasaran: convertToCsvUrl(urls.pemasaran),
      transaksi: convertToCsvUrl(urls.transaksi),
      anggaran: convertToCsvUrl(urls.anggaran)
    };

    localStorage.setItem('sigap_spreadsheet_urls', JSON.stringify({
      ...csvObj,
      raw: rawObj // save raw so we can populate the inputs correctly on reload
    }));
    
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
    
    // Trigger global refresh so other components reload data
    window.dispatchEvent(new Event('sigap:refresh'));
  };

  const handleChange = (key, value) => {
    setUrls(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div
          className="icon-wrapper-interactive"
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))',
            border: '1px solid rgba(37,99,235,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 2, flexShrink: 0,
          }}
        >
          <Database size={20} style={{ color: '#2563EB' }} />
        </div>
        <div>
          <h1 className="page-heading" style={{ marginBottom: 4 }}>
            Pengaturan Sumber Data (Multi-Spreadsheet)
          </h1>
          <p className="page-description">
            Pisahkan file Google Spreadsheet berdasarkan bagian/divisi. Sistem akan menggabungkannya secara otomatis.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Konfigurasi Tautan Spreadsheet</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Masukkan link Google Sheets yang valid (pastikan akses berbaginya diset ke "Anyone with the link can view").</p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '32px' }}>
            
            {/* Bagian Jaringan */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37,99,235,0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data Jaringan & Keandalan <span style={{ color: '#EF4444' }}>*</span></h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Digunakan untuk halaman SAIDI, SAIFI, ENS, dan Gangguan.</p>
                </div>
                <input 
                  type="text" 
                  value={urls.jaringan}
                  onChange={(e) => handleChange('jaringan', e.target.value)}
                  placeholder="Masukkan link Google Sheets Jaringan..."
                  className="input"
                  required
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* Bagian Pemasaran */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data Pemasaran & Pelayanan</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Digunakan untuk Jumlah Pelanggan, Daya Tersambung, Penjualan TL, dan Pendapatan.</p>
                </div>
                <input 
                  type="text" 
                  value={urls.pemasaran}
                  onChange={(e) => handleChange('pemasaran', e.target.value)}
                  placeholder="Kosongkan jika masih gabung di link Jaringan..."
                  className="input"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* Bagian Transaksi Energi */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data Transaksi Energi</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Digunakan untuk Susut Jaringan, P2TL, dan Ganti Meter.</p>
                </div>
                <input 
                  type="text" 
                  value={urls.transaksi}
                  onChange={(e) => handleChange('transaksi', e.target.value)}
                  placeholder="Kosongkan jika masih gabung..."
                  className="input"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* Bagian Anggaran */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data Anggaran & Keuangan</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Digunakan untuk SKKI Luncuran, SKKI Murni, dan SKKO.</p>
                </div>
                <input 
                  type="text" 
                  value={urls.anggaran}
                  onChange={(e) => handleChange('anggaran', e.target.value)}
                  placeholder="Kosongkan jika masih gabung..."
                  className="input"
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
            {savedStatus && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Pengaturan Berhasil Disimpan
              </span>
            )}
            <button type="submit" className="btn-primary" style={{ padding: '0 24px', height: 44, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={18} /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
      
      <div style={{
          padding: 20, borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#D97706', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} /> Penting! Ketentuan Format Spreadsheet
          </h4>
          <ol style={{ listStyle: 'decimal', paddingLeft: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Setiap spreadsheet baru <strong>wajib</strong> memiliki nama Tab (Sheet) di dalamnya yang bernama <strong>MASTER_DATA</strong>.</li>
            <li>Struktur kolom dasar seperti <code>INDIKATOR</code>, <code>BULAN</code>, <code>REALISASI</code>, <code>TARGET</code> harus memiliki ejaan yang sama agar sistem bisa mendeteksinya.</li>
            <li>Pastikan setiap file sudah di-setting <em>"Anyone with the link can view"</em>.</li>
            <li>Jika suatu bagian belum memiliki file spreadsheet sendiri, kosongkan saja kotaknya. Sistem akan otomatis menggunakan data dari Spreadsheet Jaringan.</li>
          </ol>
      </div>

    </div>
  );
}
