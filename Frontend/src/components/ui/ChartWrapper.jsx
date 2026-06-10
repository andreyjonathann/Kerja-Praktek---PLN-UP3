import React from 'react'
import { AlertCircle, RefreshCw, BarChart2 } from 'lucide-react'

/**
 * ChartWrapper — Premium chart container with loading / error / empty states
 */
export default function ChartWrapper({
  title, subtitle, loading = false, error = null, empty = false,
  emptyMessage = 'Belum ada data untuk periode ini',
  height = 320, onRetry, actions, children,
}) {
  return (
    <div className="card" style={{ padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{
        padding:'18px 22px 14px',
        borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12,
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{
            fontSize:'1.05rem', fontWeight:800, color:'var(--text-primary)',
            letterSpacing:'-0.01em', lineHeight:1.3,
            marginBottom: subtitle ? 4 : 0,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.4 }}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>{actions}</div>
        )}
      </div>

      {/* Body */}
      <div style={{
        padding:'16px 18px 20px',
        minHeight: height,
        display:'flex', alignItems:'center', justifyContent:'center', flex:1,
      }}>
        {loading  ? <SkeletonChart height={height} />
        : error   ? <ErrorState message={error} onRetry={onRetry} />
        : empty   ? <EmptyState message={emptyMessage} />
        : <div style={{ width:'100%' }}>{children}</div>}
      </div>
    </div>
  )
}

function SkeletonChart({ height }) {
  return (
    <div style={{ width:'100%', height }} className="animate-pulse">
      <div style={{ display:'flex', gap:16, height:'100%' }}>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', paddingBottom:24, width:36 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height:8, width:28, borderRadius:4 }} />
          ))}
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'flex-end', gap:8, paddingBottom:24 }}>
          {Array.from({length:12},(_,i) => (
            <div key={i} className="skeleton" style={{
              flex:1, borderRadius:'6px 6px 0 0',
              height:`${25 + Math.sin(i)*20 + 30}%`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'32px 16px', textAlign:'center' }}>
      <div style={{
        width:48, height:48, borderRadius:'50%',
        background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <AlertCircle size={22} style={{ color:'#FCA5A5' }} />
      </div>
      <div>
        <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.98rem', marginBottom:4 }}>
          Gagal memuat data
        </p>
        <p style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary"
          style={{ fontSize:'0.88rem', padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'32px 16px', textAlign:'center' }}>
      <div style={{
        width:48, height:48, borderRadius:'50%',
        background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <BarChart2 size={22} style={{ color:'var(--text-muted)' }} />
      </div>
      <div>
        <p style={{ fontWeight:700, color:'var(--text-secondary)', fontSize:'0.98rem', marginBottom:4 }}>
          Tidak Ada Data
        </p>
        <p style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>{message}</p>
      </div>
    </div>
  )
}
