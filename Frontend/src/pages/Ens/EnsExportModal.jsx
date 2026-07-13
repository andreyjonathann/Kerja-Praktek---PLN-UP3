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
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
        <Dialog.Content 
          style={{ 
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            zIndex: 50, width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
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
                  Export Data ENS ke Excel
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="btn-ghost" style={{ padding: '8px', borderRadius: '8px' }}>
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '24px' }}>
              Pilih rentang waktu untuk diekspor ke Excel.
            </p>
            
            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label className="label-muted" style={{ display: 'block', marginBottom: '8px' }}>DARI BULAN TAHUN</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select 
                    value={startMonth} 
                    onChange={e => setStartMonth(Number(e.target.value))}
                    className="select"
                    style={{ flex: 1 }}
                  >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <select 
                    value={startYear} 
                    onChange={e => setStartYear(Number(e.target.value))}
                    className="select"
                    style={{ width: '120px' }}
                  >
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="label-muted" style={{ display: 'block', marginBottom: '8px' }}>SAMPAI BULAN TAHUN</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select 
                    value={endMonth} 
                    onChange={e => setEndMonth(Number(e.target.value))}
                    className="select"
                    style={{ flex: 1 }}
                  >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <select 
                    value={endYear} 
                    onChange={e => setEndYear(Number(e.target.value))}
                    className="select"
                    style={{ width: '120px' }}
                  >
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
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
              Sistem akan mengolah data ENS untuk periode yang dipilih.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
