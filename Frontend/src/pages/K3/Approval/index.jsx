import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, MessageSquare, ShieldCheck } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { K3_STATUS_COLORS, MONTHS_FULL_ID } from '@/data/k3MasterData'
import { useNavigate } from 'react-router-dom'

// ─── Mock Assessment List ──────────────────────────────────────────────────────
const MOCK_ASSESSMENTS = [
  {
    id: 1, unit: 'UP3 Kebon Jeruk',
    bulan: 5, tahun: 2026,
    status: 'submitted',
    total_criteria: 17, filled: 17,
    avg_score: 3.7, submitted_at: '2026-06-01',
    submitted_by: 'Ahmad Fauzi'
  },
  {
    id: 2, unit: 'UP3 Kebon Jeruk',
    bulan: 4, tahun: 2026,
    status: 'submitted',
    total_criteria: 17, filled: 17,
    avg_score: 3.5, submitted_at: '2026-05-02',
    submitted_by: 'Ahmad Fauzi'
  },
  {
    id: 3, unit: 'UP3 Kebon Jeruk',
    bulan: 3, tahun: 2026,
    status: 'revisi',
    total_criteria: 17, filled: 17,
    avg_score: 3.2, submitted_at: '2026-04-03',
    submitted_by: 'Rina Wulandari',
    catatan_revisor: 'Mohon dilengkapi justifikasi untuk kriteria 2.1 dan 3.3 dengan bukti pendukung yang valid.'
  },
]

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ assessment, onClose, onApprove, onRevisi }) {
  const [catatan, setCatatan] = useState('')
  const [action, setAction]  = useState(null) // 'approve' | 'revisi'

  if (!assessment) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: 28,
        maxWidth: 500, width: '92%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          Review Assessment K3
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18 }}>
          {assessment.unit} · {MONTHS_FULL_ID[assessment.bulan - 1]} {assessment.tahun}
        </p>

        {/* Summary */}
        <div style={{
          background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px',
          marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0070C0' }}>{assessment.avg_score} / 5</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Disubmit oleh</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{assessment.submitted_by}</div>
          </div>
        </div>

        {/* Action selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setAction('approve')}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: '2px solid',
              borderColor: action === 'approve' ? '#16A34A' : 'var(--border-subtle)',
              background: action === 'approve' ? '#F0FDF4' : 'var(--bg-card)',
              color: action === 'approve' ? '#16A34A' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s'
            }}
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            onClick={() => setAction('revisi')}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: '2px solid',
              borderColor: action === 'revisi' ? '#D97706' : 'var(--border-subtle)',
              background: action === 'revisi' ? '#FFFBEB' : 'var(--bg-card)',
              color: action === 'revisi' ? '#D97706' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s'
            }}
          >
            <XCircle size={16} /> Minta Revisi
          </button>
        </div>

        {/* Catatan field */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Catatan {action === 'revisi' ? '(wajib untuk revisi)' : '(opsional)'}
          </label>
          <textarea
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={3}
            placeholder={action === 'revisi'
              ? 'Jelaskan apa yang perlu diperbaiki...'
              : 'Catatan persetujuan (opsional)...'}
            style={{
              width: '100%', borderRadius: 10, padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.82rem', resize: 'vertical'
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border-subtle)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
          }}>Batal</button>
          <button
            disabled={!action || (action === 'revisi' && !catatan.trim())}
            onClick={() => {
              if (action === 'approve') onApprove(assessment.id, catatan)
              else onRevisi(assessment.id, catatan)
              onClose()
            }}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: action === 'approve' ? '#16A34A' : action === 'revisi' ? '#D97706' : '#94A3B8',
              color: '#fff', fontWeight: 700, cursor: !action ? 'not-allowed' : 'pointer',
              opacity: (!action || (action === 'revisi' && !catatan.trim())) ? 0.5 : 1
            }}
          >
            {action === 'approve' ? 'Approve' : action === 'revisi' ? 'Kirim Revisi' : 'Pilih Tindakan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3ApprovalPage() {
  const { isAdminK3 } = useAuth()
  const navigate       = useNavigate()
  const [assessments, setAssessments] = useState(MOCK_ASSESSMENTS)
  const [selected, setSelected]       = useState(null)

  if (!isAdminK3) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in py-4">
        <PageHeader title="Approval Assessment K3" description="Persetujuan penilaian mandiri K3" icon={ShieldCheck} iconColor="#0070C0" />
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 16, padding: '32px',
          textAlign: 'center', color: '#DC2626'
        }}>
          <XCircle size={40} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, fontSize: '1rem' }}>Akses Ditolak</p>
          <p style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.8 }}>
            Halaman ini hanya dapat diakses oleh Admin K3.
          </p>
        </div>
      </div>
    )
  }

  const handleApprove = (id, catatan) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
  }

  const handleRevisi = (id, catatan) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, status: 'revisi', catatan_revisor: catatan } : a))
  }

  const pending   = assessments.filter(a => a.status === 'submitted')
  const processed = assessments.filter(a => a.status !== 'submitted')

  const AssessmentCard = ({ a, showAction }) => {
    const cfg = K3_STATUS_COLORS[a.status]
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        marginBottom: 10, transition: 'box-shadow 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {a.unit}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
            {MONTHS_FULL_ID[a.bulan - 1]} {a.tahun} · Disubmit oleh {a.submitted_by}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0070C0' }}>{a.avg_score}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Score</div>
        </div>

        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${cfg?.bg} ${cfg?.text}`}>
          {cfg?.label}
        </span>

        {a.catatan_revisor && (
          <div style={{
            width: '100%', marginTop: 4,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 10, padding: '8px 12px',
            fontSize: '0.8rem', color: '#92400E'
          }}>
            <MessageSquare size={12} style={{ display: 'inline', marginRight: 6 }} />
            <strong>Catatan revisor:</strong> {a.catatan_revisor}
          </div>
        )}

        {showAction && (
          <button
            onClick={() => setSelected(a)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none',
              background: '#0070C0', color: '#fff',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            Review
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-4">
      <PageHeader
        title="Approval Assessment K3"
        description="Review dan persetujuan penilaian mandiri K3"
        icon={ShieldCheck}
        iconColor="#0070C0"
      />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Menunggu Review', count: pending.length, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Disetujui', count: assessments.filter(a => a.status === 'approved').length, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Perlu Revisi', count: assessments.filter(a => a.status === 'revisi').length, color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 140,
            background: s.bg, border: `1px solid ${s.color}30`,
            borderRadius: 14, padding: '14px 18px'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock size={16} style={{ color: '#D97706' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Menunggu Review ({pending.length})
          </h3>
        </div>
        {pending.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.875rem' }}>
              Tidak ada assessment yang menunggu review.
            </div>
          : pending.map(a => <AssessmentCard key={a.id} a={a} showAction={true} />)
        }
      </div>

      {/* Processed section */}
      {processed.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle size={16} style={{ color: '#16A34A' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Riwayat Review
            </h3>
          </div>
          {processed.map(a => <AssessmentCard key={a.id} a={a} showAction={false} />)}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <ReviewModal
          assessment={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onRevisi={handleRevisi}
        />
      )}
    </div>
  )
}
