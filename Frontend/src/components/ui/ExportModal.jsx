import notify from '@/utils/notify';
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import { getDashboardData } from '@/services/dashboardDataService';
import { getNiagaData } from '@/services/niagaDataService';
import { exportToExcel } from '@/utils/excelExport';
import { toPng } from 'html-to-image';

export default function ExportModal({ kpiType, chartRef }) {
  const [open, setOpen] = useState(false);
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (startYear > endYear) {
      notify.warning("Tahun awal tidak boleh lebih besar dari tahun akhir");
      return;
    }
    
    setLoading(true);
    try {
      const dataMap = {};
      const isNiaga = ['pelunasan prr', 'penghapusan prr', 'saldo akhir'].includes(kpiType.toLowerCase());
      
      for (let y = startYear; y <= endYear; y++) {
        if (isNiaga) {
          const res = await getNiagaData(y);
          dataMap[y] = res || [];
        } else {
          const res = await getDashboardData(y);
          dataMap[y] = res[kpiType.toLowerCase()] || [];
        }
      }
      
      // Capture chart if available
      let imgDataUrl = null;
      if (chartRef && chartRef.current) {
        try {
          imgDataUrl = await toPng(chartRef.current, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          });
        } catch (chartErr) {
          console.warn('[ExportModal] Gagal capture chart:', chartErr);
        }
      }

      await exportToExcel(kpiType, startYear, endYear, dataMap, imgDataUrl);
      setOpen(false);
    } catch (err) {
      console.error(err);
      notify.error(err.message, 'Gagal mengekspor data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(16, 185, 129, 0.05)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid rgba(16, 185, 129, 0.15)',
          cursor: 'pointer'
        }}>
          <button
            style={{
              padding: '6px 16px',
              borderRadius: 9,
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              color: '#10B981',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Export ke Excel"
          >
            <FileSpreadsheet size={16} /> Export
          </button>
        </div>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
        <Dialog.Content 
          style={{ 
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            zIndex: 50, wfull: '100%', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: 'inherit'
          }}
        >
          {/* Top Section */}
          <div style={{ padding: '32px 32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
                  <FileSpreadsheet size={24} style={{ color: 'var(--text-accent)' }} />
                </div>
                <Dialog.Title style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Export {kpiType} ke Excel
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="btn-ghost" style={{ padding: '8px', borderRadius: '8px' }}>
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '24px' }}>
              Pilih rentang tahun untuk diekspor ke Excel.
            </p>
            
            {/* Inputs */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label className="label-muted" style={{ display: 'block', marginBottom: '8px' }}>TAHUN AWAL</label>
                <select 
                  value={startYear} 
                  onChange={e => setStartYear(Number(e.target.value))}
                  className="select"
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label-muted" style={{ display: 'block', marginBottom: '8px' }}>TAHUN AKHIR</label>
                <select 
                  value={endYear} 
                  onChange={e => setEndYear(Number(e.target.value))}
                  className="select"
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-strong)', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={handleExport}
              disabled={loading}
              className="btn-primary hover-lift"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}
            >
              {loading ? (
                <span>Mengekspor...</span>
              ) : (
                <><Download size={20} /> Download Excel</>
              )}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
              Sistem akan mengolah data {kpiType} untuk periode yang dipilih.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
