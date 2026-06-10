import React from 'react'
import { Construction, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PlaceholderPage({ title = 'Halaman' }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-fade-in">
      <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <Construction size={36} className="text-amber-500" style={{ animation: 'bounce 1s infinite' }} />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title} — Dalam Pengembangan
      </h2>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 440, marginBottom: 32, lineHeight: 1.6 }}>
        Modul halaman ini masuk dalam pengerjaan <strong>Phase 2</strong> dari program magang SIGAP PLN UP3 Kebon Jeruk. Fitur database &amp; form input sedang disinkronisasikan.
      </p>

      <button
        onClick={() => navigate('/')}
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 40, fontSize: '0.85rem' }}
      >
        <ArrowLeft size={14} />
        Kembali ke Dashboard Utama
      </button>
    </div>
  )
}
