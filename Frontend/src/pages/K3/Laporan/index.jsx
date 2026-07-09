import React, { useState, useEffect } from 'react'
import { FileSpreadsheet, FileText, Download, Filter, ShieldCheck, TrendingUp, Edit2, Save, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { K3_CATEGORIES, MONTHS_FULL_ID } from '@/data/k3MasterData'
import * as XLSX from 'xlsx'
import { k3AssessmentService } from '@/services/k3AssessmentService'
import { useFilter } from '@/context/FilterContext'

const INITIAL_MOCK_DATA = [
  { bulan: 1, bulanStr: 'Januari', lmc: 3.5, aai: 3.0, ibp: 3.8, ste: 3.2, scc: 2.8, rep: 3.5, avg: 3.3, status: 'approved' },
  { bulan: 2, bulanStr: 'Februari', lmc: 3.5, aai: 3.2, ibp: 3.8, ste: 3.3, scc: 2.9, rep: 3.5, avg: 3.4, status: 'approved' },
  { bulan: 3, bulanStr: 'Maret', lmc: 3.7, aai: 3.2, ibp: 4.0, ste: 3.4, scc: 2.9, rep: 3.6, avg: 3.5, status: 'approved' },
  { bulan: 4, bulanStr: 'April', lmc: 3.7, aai: 3.2, ibp: 4.0, ste: 3.5, scc: 2.9, rep: 3.7, avg: 3.5, status: 'approved' },
  { bulan: 5, bulanStr: 'Mei', lmc: 3.8, aai: 3.2, ibp: 4.1, ste: 3.5, scc: 2.9, rep: 3.7, avg: 3.5, status: 'submitted' },
  { bulan: 6, bulanStr: 'Juni', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 7, bulanStr: 'Juli', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 8, bulanStr: 'Agustus', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 9, bulanStr: 'September', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 10, bulanStr: 'Oktober', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 11, bulanStr: 'November', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
  { bulan: 12, bulanStr: 'Desember', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null, status: 'draft' },
]

const CAT_KEYS = [
  { key: 'lmc', label: 'LMC', color: '#0070C0' },
  { key: 'aai', label: 'AAI', color: '#16A34A' },
  { key: 'ibp', label: 'IBP', color: '#D97706' },
  { key: 'ste', label: 'STE', color: '#7C3AED' },
  { key: 'scc', label: 'SCC', color: '#0891B2' },
  { key: 'rep', label: 'REP', color: '#DC2626' },
]

const STATUS_BADGE = {
  approved:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Approved' },
  submitted: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Submitted' },
  draft:     { bg: 'bg-slate-100', text: 'text-slate-600',  label: 'Draft' },
  revisi:    { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Revisi' },
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function K3LaporanPage() {
  const { isAdminK3, user } = useAuth()
  const { filters } = useFilter()
  const [selectedYear, setSelectedYear] = useState(filters.year || 2026)
  const [exporting, setExporting]       = useState(false)
  const [reportData, setReportData]     = useState(INITIAL_MOCK_DATA)
  const [loading, setLoading]           = useState(true)

  // Fetch real data to merge with mock
  useEffect(() => {
    setLoading(true)
    k3AssessmentService.getAssessments({ tahun: selectedYear, unit: filters.up3 })
      .then(async (asmList) => {
        // Fetch full details for each assessment found
        const fullAssessments = await Promise.all(
          asmList.map(asm => k3AssessmentService.getAssessmentById(asm.id))
        )
        
        setReportData(prev => prev.map((row, idx) => {
          const monthNum = idx + 1
          const full = fullAssessments.find(a => parseInt(a.periode_bulan) === monthNum)
          
          if (!full) return { ...row, status: 'draft', lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null, avg: null }

          // Calculate per-category averages
          const catAvgs = {}
          CAT_KEYS.forEach(c => {
            const crits = full.details.filter(d => d.category_code === c.key.toUpperCase())
            const answered = crits.filter(d => d.level_chosen !== null)
            if (answered.length > 0) {
              const sum = answered.reduce((acc, cr) => acc + cr.level_chosen, 0)
              catAvgs[c.key] = sum / answered.length
            } else {
              catAvgs[c.key] = null
            }
          })
          
          // Total avg (only averaging categories that have a score, or 0 if we want strict)
          const validCats = CAT_KEYS.filter(c => catAvgs[c.key] !== null)
          const sumAvg = validCats.reduce((acc, c) => acc + catAvgs[c.key], 0)
          const avg = validCats.length > 0 ? (sumAvg / validCats.length) : null

          return {
            ...row,
            status: full.status,
            ...catAvgs,
            avg: avg
          }
        }))
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [selectedYear, filters.up3])
  
  // Edit State
  const [editingRow, setEditingRow] = useState(null)
  const [editValues, setEditValues] = useState({})

  const completedRows = reportData.filter(r => r.avg !== null)
  const yearAvg = completedRows.length > 0
    ? (completedRows.reduce((a, r) => a + r.avg, 0) / completedRows.length).toFixed(2)
    : '-'

  const handleExportExcel = () => {
    setExporting(true)
    setTimeout(() => {
      const headers = ['Bulan', ...CAT_KEYS.map(c => c.key.toUpperCase()), 'Rata-rata', 'Status']
      const wsData = [headers]
      
      reportData.forEach(row => {
        const monthName = row.bulanStr
        const catValues = CAT_KEYS.map(c => row[c.key] ? Number(row[c.key].toFixed(1)) : null)
        const avgValue = row.avg ? Number(row.avg.toFixed(2)) : null
        wsData.push([monthName, ...catValues, avgValue, row.status])
      })
      
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Laporan_K3")
      
      XLSX.writeFile(wb, `Laporan_K3_${selectedYear}.xlsx`)
      setExporting(false)
    }, 600)
  }

  const handleEditClick = (row) => {
    setEditingRow(row.bulan)
    const initialValues = {}
    CAT_KEYS.forEach(c => {
      initialValues[c.key] = row[c.key] || 0
    })
    setEditValues(initialValues)
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditValues({})
  }

  const handleSaveEdit = (bulan) => {
    setReportData(prev => prev.map(row => {
      if (row.bulan === bulan) {
        // Calculate new average
        const sum = CAT_KEYS.reduce((acc, c) => acc + Number(editValues[c.key]), 0)
        const newAvg = sum / 6
        return {
          ...row,
          ...editValues,
          avg: newAvg,
          // If it was draft, maybe automatically change to submitted or approved?
          status: row.status === 'draft' ? 'submitted' : row.status
        }
      }
      return row
    }))
    setEditingRow(null)
    setEditValues({})
  }

  const handleInputChange = (key, val) => {
    let num = parseFloat(val)
    if (isNaN(num)) num = 0
    if (num < 0) num = 0
    if (num > 5) num = 5
    setEditValues(prev => ({ ...prev, [key]: num }))
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-4">
      <PageHeader
        title="Laporan K3 Maturity Level"
        description="Rekapitulasi dan export laporan penilaian K3 per periode"
        icon={FileText}
        iconColor="#0070C0"
      />

      {/* Filter + Export bar */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '14px 20px',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit:</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{filters.up3 || 'Semua Unit'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tahun:</span>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '6px 10px', borderRadius: 9,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.875rem'
            }}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              border: '1px solid #16A34A', background: '#F0FDF4',
              color: '#16A34A', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              opacity: exporting ? 0.6 : 1
            }}
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Rata-rata Tahun', value: yearAvg, unit: '/ 5.0', color: '#0070C0' },
          { label: 'Periode Selesai', value: completedRows.length, unit: `/ 12`, color: '#16A34A' },
          { label: 'Approved', value: reportData.filter(r => r.status === 'approved').length, unit: 'bulan', color: '#16A34A' },
          { label: 'Pending Review', value: reportData.filter(r => r.status === 'submitted').length, unit: 'bulan', color: '#D97706' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main report table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={15} style={{ color: '#0070C0' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Rekap Skor K3 per Bulan — {selectedYear}
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bulan</th>
                {CAT_KEYS.map(c => (
                  <th key={c.key} style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: c.color, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Avg</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                {isAdminK3 && <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => {
                const statusCfg = STATUS_BADGE[row.status]
                const isNull = row.avg === null
                const isEditing = editingRow === row.bulan

                return (
                  <tr key={row.bulan} style={{
                    borderTop: '1px solid var(--border-subtle)',
                    opacity: isNull && !isEditing ? 0.5 : 1,
                    background: isEditing ? 'rgba(0,112,192,0.04)' : 'transparent'
                  }}
                    onMouseEnter={e => { if (!isNull && !isEditing) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                    onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {row.bulanStr}
                    </td>
                    
                    {CAT_KEYS.map(c => (
                      <td key={c.key} style={{ padding: '11px 10px', textAlign: 'center' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={editValues[c.key] ?? ''}
                            onChange={(e) => handleInputChange(c.key, e.target.value)}
                            style={{
                              width: '50px', padding: '4px 6px', borderRadius: 6,
                              border: `1px solid ${c.color}60`, textAlign: 'center',
                              fontWeight: 700, color: c.color, fontSize: '0.85rem'
                            }}
                          />
                        ) : row[c.key] !== null ? (
                          <span style={{ fontWeight: 700, color: c.color }}>
                            {row[c.key].toFixed(1)}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    ))}
                    
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      {isEditing ? (
                        <span style={{ fontWeight: 800, color: '#0070C0', fontSize: '0.9rem' }}>
                          {(CAT_KEYS.reduce((acc, c) => acc + Number(editValues[c.key] || 0), 0) / 6).toFixed(2)}
                        </span>
                      ) : row.avg !== null ? (
                        <span style={{ fontWeight: 800, color: '#0070C0', fontSize: '0.9rem' }}>
                          {row.avg.toFixed(2)}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusCfg?.bg} ${statusCfg?.text}`}>
                        {statusCfg?.label}
                      </span>
                    </td>

                    {isAdminK3 && (
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleSaveEdit(row.bulan)}
                              title="Simpan"
                              style={{ background: '#16A34A', color: '#fff', border: 'none', padding: 4, borderRadius: 6, cursor: 'pointer' }}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              title="Batal"
                              style={{ background: '#EF4444', color: '#fff', border: 'none', padding: 4, borderRadius: 6, cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(row)}
                            style={{
                              background: 'transparent', border: 'none', color: '#0070C0', cursor: 'pointer',
                              padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center'
                            }}
                            title="Edit Manual (Override)"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-subtle)', borderTop: '2px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>RATA-RATA</td>
                {CAT_KEYS.map(c => {
                  const vals = reportData.filter(r => r[c.key] !== null).map(r => r[c.key])
                  const avg  = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                  return (
                    <td key={c.key} style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 800, color: c.color }}>
                      {avg}
                    </td>
                  )
                })}
                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#0070C0', fontSize: '0.95rem' }}>
                  {yearAvg}
                </td>
                <td colSpan={isAdminK3 ? 2 : 1} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '18px 20px'
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 16 }}>
          📊 Ringkasan per Kategori (Rata-rata s/d bulan terakhir)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {K3_CATEGORIES.map(cat => {
            const catKey = cat.code.toLowerCase()
            const vals   = reportData.filter(r => r[catKey] !== null).map(r => r[catKey])
            const avg    = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
            const pct    = (avg / 5) * 100
            return (
              <div key={cat.code} style={{
                background: cat.bgLight, border: `1px solid ${cat.border}`,
                borderRadius: 12, padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cat.color, background: cat.color + '18', padding: '2px 7px', borderRadius: 99 }}>
                      {cat.code}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 8 }}>
                      {cat.shortName}
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: cat.color }}>{avg.toFixed(1)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
                <div style={{ marginTop: 4, fontSize: '0.7rem', color: cat.color, opacity: 0.75, textAlign: 'right' }}>
                  {pct.toFixed(0)}% dari maks
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
