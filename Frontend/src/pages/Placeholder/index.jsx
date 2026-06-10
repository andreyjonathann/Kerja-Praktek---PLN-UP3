import React from 'react'
import { Settings, Construction, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PlaceholderPage({ title = 'Halaman' }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-fade-in">
      <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <Construction size={36} className="text-amber-500 animate-bounce" />
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">
        {title} — Dalam Pengembangan
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
        Modul halaman ini masuk dalam pengerjaan <strong>Phase 2</strong> dari program magang SIGAP PLN UP3 Kebon Jeruk. Fitur database &amp; form input sedang disinkronisasikan.
      </p>

      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-2 px-5 h-10 text-xs font-semibold"
      >
        <ArrowLeft size={14} />
        Kembali ke Dashboard Utama
      </button>
    </div>
  )
}
