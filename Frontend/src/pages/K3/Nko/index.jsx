import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Target, Edit3, X, Save, AlertTriangle
} from 'lucide-react'
import KpiCard      from '@/components/ui/KpiCard'
import DataTable    from '@/components/ui/DataTable'
import PageHeader   from '@/components/ui/PageHeader'
import { useAuth }  from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { k3AssessmentService } from '@/services/k3AssessmentService'
import ErrorBanner from '@/components/ui/ErrorBanner'
import Toast from '@/components/ui/Toast'

export default function K3NkoPage() {
  const { user, isAdmin } = useAuth()
  const { filters } = useFilter()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toastState, setToastState] = useState(null)
  const [categories, setCategories] = useState([])
  
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const saved = sessionStorage.getItem('k3_nko_semester')
    return saved ? saved : (new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  })

  // Edit Modal State
  const [editCategory, setEditCategory] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    sessionStorage.setItem('k3_nko_semester', selectedSemester)
  }, [selectedSemester])

  useEffect(() => {
    k3AssessmentService.getCategories()
      .then(data => setCategories(data.map(c => ({ ...c, shortName: c.short_name }))))
      .catch(err => console.error('Gagal memuat kategori K3:', err))
  }, [])

  const loadData = () => {
    setLoading(true)
    k3AssessmentService.getNkoSummary(filters.year, selectedSemester)
      .then(res => {
        setData(res)
      })
      .catch(err => {
        console.error(err)
        setError("Gagal memuat data NKO K3.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [filters.year, selectedSemester])

  const handleEditClick = (category) => {
    setEditCategory(category)
    const initialForm = {}
    category.criteria_details.forEach(crit => {
      initialForm[crit.id] = crit.target_level || ''
    })
    setEditForm(initialForm)
  }

  const handleSaveTarget = async () => {
    if (!editCategory) return
    setSaving(true)
    try {
      // Loop criteria, create/update target
      const period = `${filters.year}-${selectedSemester}`
      for (const crit of editCategory.criteria_details) {
        const tVal = editForm[crit.id]
        if (tVal !== '') {
          const numVal = parseInt(tVal)
          if (crit.target_id) {
            await k3AssessmentService.updateTarget(crit.target_id, numVal)
          } else {
            await k3AssessmentService.createTarget(crit.id, period, numVal)
          }
        }
      }
      setEditCategory(null)
      loadData()
      setToastState({ message: "Berhasil menyimpan target.", type: "success" })
    } catch(err) {
      console.error(err)
      setToastState({ message: "Gagal menyimpan target.", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const CATEGORY_MAP = Object.fromEntries(categories.map(c => [c.code, c]))
  const categoriesData = data?.categories || []

  const validScores = categoriesData.filter(c => c.avg_score !== null)
  const validTargets = categoriesData.filter(c => c.avg_target !== null)
  
  const totalScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b.avg_score, 0) / validScores.length) : null
  const totalTarget = validTargets.length > 0 ? (validTargets.reduce((a, b) => a + b.avg_target, 0) / validTargets.length) : null
  const totalGap = (totalScore !== null && totalTarget !== null) ? totalScore - totalTarget : null

  const TABLE_COLUMNS = useMemo(() => [
    {
      key: 'category_code', label: 'Kode', width: '70px', align: 'center',
      render: (v) => {
        const cat = CATEGORY_MAP[v] ?? {}
        return (
          <span style={{
            display: 'inline-block', padding: '2px 9px', borderRadius: 6,
            background: (cat.color ?? '#0070C0') + '18',
            color: cat.color ?? '#0070C0',
            fontSize: '0.78rem', fontWeight: 800,
          }}>
            {v}
          </span>
        )
      },
    },
    {
      key: 'category_name', label: 'Kategori',
      render: (v) => <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>,
    },
    {
      key: 'avg_target', label: 'Target', width: '100px', align: 'center',
      render: (v) => v !== null 
        ? <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{v.toFixed(2)}</span>
        : <span style={{ color: 'var(--border-strong)' }}>-</span>
    },
    {
      key: 'avg_score', label: 'Realisasi', width: '100px', align: 'center',
      render: (v) => v !== null 
        ? <span style={{ fontWeight: 900, color: '#0070C0' }}>{v.toFixed(2)}</span>
        : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Belum dinilai</span>
    },
    {
      key: 'gap', label: 'Gap', width: '100px', align: 'center',
      render: (v) => {
        if (v === null) return <span style={{ color: 'var(--border-strong)' }}>-</span>
        const isPositive = v >= 0
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 99,
            fontSize: '0.75rem', fontWeight: 700,
            background: isPositive ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
            color: isPositive ? '#16A34A' : '#DC2626'
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{v.toFixed(2)}
          </span>
        )
      }
    },
    ...(isAdmin ? [{
      key: 'actions', label: 'Aksi', width: '90px', align: 'center',
      render: (_, row) => (
        <button
          onClick={() => handleEditClick(row)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 6,
            background: 'transparent', border: '1px solid #2563eb',
            fontSize: '0.75rem', fontWeight: 600, color: '#2563eb',
            cursor: 'pointer'
          }}
        >
          <Edit3 size={12} /> Edit
        </button>
      )
    }] : [])
  ], [isAdmin, CATEGORY_MAP])

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data NKO...</div>

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nilai Kinerja Organisasi (NKO) K3"
        description={`Monitoring Target vs Realisasi Maturity Level K3 · Tahun ${filters.year} · Semester ${selectedSemester === 'S1' ? '1' : '2'}`}
        icon={Target}
        iconColor="#0070C0"
      >
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <option value="S1">Semester 1 (Jan-Jun)</option>
          <option value="S2">Semester 2 (Jul-Des)</option>
        </select>
      </PageHeader>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <KpiCard
          title="Rata-rata Target"
          value={totalTarget !== null ? totalTarget.toFixed(2) : '-'}
          icon={Target}
          color="gray"
        />
        <KpiCard
          title="Rata-rata Realisasi"
          value={totalScore !== null ? totalScore.toFixed(2) : '-'}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title="Total Gap"
          value={totalGap !== null ? ((totalGap >= 0 ? '+' : '') + totalGap.toFixed(2)) : '-'}
          icon={totalGap !== null && totalGap < 0 ? TrendingDown : TrendingUp}
          color={totalGap !== null ? (totalGap >= 0 ? 'green' : 'red') : 'gray'}
        />
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Detail Pencapaian per Kategori</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hanya assessment berstatus Approved yang dihitung dalam Realisasi.</p>
        </div>
        <DataTable
          columns={TABLE_COLUMNS}
          data={categoriesData}
          paginated={false}
          searchable={false}
        />
      </div>

      {/* Edit Modal for Admin */}
      {editCategory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Edit Target: {editCategory.category_code}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editCategory.category_name}</p>
              </div>
              <button onClick={() => setEditCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {editCategory.criteria_details.map(crit => (
                  <div key={crit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{crit.code} - {crit.name}</p>
                    </div>
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <input
                        type="number"
                        min="1" max="5"
                        value={editForm[crit.id] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [crit.id]: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          border: '1px solid var(--border)', fontSize: '0.9rem',
                          textAlign: 'center'
                        }}
                        placeholder="1-5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-subtle)' }}>
              <button onClick={() => setEditCategory(null)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
              }}>Batal</button>
              <button disabled={saving} onClick={handleSaveTarget} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#0070C0', color: 'white', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastState && (
        <Toast 
          message={toastState.message} 
          type={toastState.type} 
          onClose={() => setToastState(null)} 
        />
      )}
    </div>
  )
}
