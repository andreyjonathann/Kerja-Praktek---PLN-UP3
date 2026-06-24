import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import { getDashboardData } from '@/services/dashboardDataService';
import { exportToExcel } from '@/utils/excelExport';

export default function ExportModal({ kpiType }) {
  const [open, setOpen] = useState(false);
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (startYear > endYear) {
      alert("Tahun awal tidak boleh lebih besar dari tahun akhir");
      return;
    }
    
    setLoading(true);
    try {
      const dataMap = {};
      
      for (let y = startYear; y <= endYear; y++) {
        const res = await getDashboardData(y);
        dataMap[y] = res[kpiType.toLowerCase()] || [];
      }
      
      exportToExcel(kpiType, startYear, endYear, dataMap);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor data: " + err.message);
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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-2xl z-50 w-full max-w-[460px] animate-zoom-in flex flex-col overflow-hidden"
          style={{ fontFamily: 'inherit' }}
        >
          {/* Top Section */}
          <div className="px-10 py-8 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: '#E0E7FF' }}>
                  <FileSpreadsheet size={22} style={{ color: '#1E3A8A' }} />
                </div>
                <Dialog.Title className="text-xl font-bold" style={{ color: '#1E3A8A' }}>
                  Export {kpiType} ke Excel
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <X size={22} />
                </button>
              </Dialog.Close>
            </div>
            
            <p className="text-sm font-medium mb-8" style={{ color: '#64748B' }}>
              Pilih rentang tahun untuk diekspor ke Excel.
            </p>
            
            {/* Inputs */}
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-2 tracking-wider" style={{ color: '#64748B' }}>TAHUN AWAL</label>
                <select 
                  value={startYear} 
                  onChange={e => setStartYear(Number(e.target.value))}
                  className="w-full rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-2 tracking-wider" style={{ color: '#64748B' }}>TAHUN AKHIR</label>
                <select 
                  value={endYear} 
                  onChange={e => setEndYear(Number(e.target.value))}
                  className="w-full rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 hover:opacity-90 shadow-sm"
              style={{ background: '#003399', color: '#FFFFFF', border: 'none' }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Download size={22} /> Download Excel</>
              )}
            </button>
            <p className="text-[11px] mt-4 text-center" style={{ color: '#64748B' }}>
              Sistem akan mengolah data {kpiType} untuk periode yang dipilih.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
