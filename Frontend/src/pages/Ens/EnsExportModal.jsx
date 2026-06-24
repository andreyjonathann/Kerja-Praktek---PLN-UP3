import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getDashboardData } from '@/services/dashboardDataService'

export default function EnsExportModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const YEAR_OPTIONS = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i)

  const [startMonth, setStartMonth] = useState(1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [endMonth, setEndMonth] = useState(12)
  const [endYear, setEndYear] = useState(new Date().getFullYear())

  const handleExport = async () => {
    const startVal = startYear * 12 + startMonth
    const endVal = endYear * 12 + endMonth
    if (startVal > endVal) {
      alert("Rentang waktu awal tidak boleh lebih besar dari waktu akhir")
      return
    }

    setLoading(true)
    try {
      let flatData = []

      for (let y = startYear; y <= endYear; y++) {
        const dbData = await getDashboardData(y)
        const formattedData = dbData.ensPageData.map(d => ({
          bulan: d.bulan,
          year: y,
          b_target: d.bulanan.target || 0,
          b_terencana: d.bulanan.padam_terencana || 0,
          b_tidakTerencana: d.bulanan.tidak_terencana || 0,
          b_bencanaAlam: d.bulanan.bencana_alam || 0,
          b_realisasi: d.bulanan[y] || 0
        }))
        flatData = [...flatData, ...formattedData]
      }

      // Filter based on selected months
      const filteredData = flatData.filter(d => {
        const val = d.year * 12 + d.bulan;
        return val >= startVal && val <= endVal;
      });

      const exportData = filteredData.map(row => ({
        'Bulan': `${MONTH_NAMES[row.bulan - 1]} ${row.year}`,
        'Terencana': row.b_terencana || 0,
        'Tidak Terencana': row.b_tidakTerencana || 0,
        'Bencana Alam': row.b_bencanaAlam || 0,
        'Total Realisasi': row.b_realisasi || 0,
        'Target': row.b_target || 0,
        'Status': row.b_realisasi > row.b_target ? 'Over' : 'Aman'
      }))

      exportData.push({
        'Bulan': 'Total (Rentang Dipilih)',
        'Terencana': filteredData.reduce((s, x) => s + (x.b_terencana || 0), 0),
        'Tidak Terencana': filteredData.reduce((s, x) => s + (x.b_tidakTerencana || 0), 0),
        'Bencana Alam': filteredData.reduce((s, x) => s + (x.b_bencanaAlam || 0), 0),
        'Total Realisasi': filteredData.reduce((s, x) => s + (x.b_realisasi || 0), 0),
        'Target': filteredData.reduce((s, x) => s + (x.b_target || 0), 0),
        'Status': filteredData.reduce((s, x) => s + (x.b_realisasi || 0), 0) > filteredData.reduce((s, x) => s + (x.b_target || 0), 0) ? 'Over' : 'Aman'
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data ENS")
      XLSX.writeFile(workbook, `Rekapitulasi_ENS_${MONTH_NAMES[startMonth-1]}_${startYear}_to_${MONTH_NAMES[endMonth-1]}_${endYear}.xlsx`)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Gagal mengekspor data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

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
                  Export Data ENS ke Excel
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <X size={22} />
                </button>
              </Dialog.Close>
            </div>
            
            <p className="text-sm font-medium mb-8" style={{ color: '#64748B' }}>
              Pilih rentang waktu untuk diekspor ke Excel.
            </p>
            
            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-2 tracking-wider" style={{ color: '#64748B' }}>DARI BULAN TAHUN</label>
                <div className="flex gap-2">
                  <select 
                    value={startMonth} 
                    onChange={e => setStartMonth(Number(e.target.value))}
                    className="flex-1 rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                  >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <select 
                    value={startYear} 
                    onChange={e => setStartYear(Number(e.target.value))}
                    className="w-28 rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                  >
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-2 tracking-wider" style={{ color: '#64748B' }}>SAMPAI BULAN TAHUN</label>
                <div className="flex gap-2">
                  <select 
                    value={endMonth} 
                    onChange={e => setEndMonth(Number(e.target.value))}
                    className="flex-1 rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                  >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <select 
                    value={endYear} 
                    onChange={e => setEndYear(Number(e.target.value))}
                    className="w-28 rounded-lg p-3 text-sm font-semibold outline-none transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155' }}
                  >
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
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
              Sistem akan mengolah data ENS untuk periode yang dipilih.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
