import React, { useState } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Activity, Calendar, Zap, Clock } from 'lucide-react'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
]

const TIPE_RCT = [
  { value: 'GI', label: 'GARDU INDUK (GI)' },
  { value: 'JTM', label: 'JARINGAN TEGANGAN MENENGAH (JTM)' },
  { value: 'GD', label: 'GARDU DISTRIBUSI (GD)' }
]

export default function InputMvodPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const currentYear = new Date().getFullYear()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tahun: currentYear, bulan: '', tipe_rct: '', rata_rata: '', kali: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tahun || !form.bulan || !form.tipe_rct || form.rata_rata === '' || form.kali === '') return alert('Semua field wajib diisi!')
    if (Number(form.rata_rata) < 0 || Number(form.kali) < 0) return alert('Angka tidak boleh negatif!')
    if (Number(form.kali) < 1) return alert('Kali padam minimal 1!')

    setSaving(true)
    try {
      const total_lama_padam_menit = Number(form.rata_rata) * Number(form.kali)
      const payload = {
        up3: user?.up3 || DEFAULT_UP3,
        tahun: Number(form.tahun),
        bulan: Number(form.bulan),
        tipe_rct: form.tipe_rct,
        total_lama_padam_jam: total_lama_padam_menit / 60, // konversi menit ke jam
        kali_padam: Number(form.kali)
      }
      await api.post('/v1/mvod', payload)
      navigate('/jaringan/mvod')
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '0.9rem', color: '#334155', outline: 'none',
  }

  const fieldInputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm bg-white outline-none focus:border-blue-500"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Tambah Realisasi MVOD</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Masukkan data Mean Value of Outage Duration</p>
          </div>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit}>

          {/* CARD PERIODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Calendar size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan <span className="text-rose-500">*</span></label>
                  <select value={form.bulan} onChange={e => setForm({ ...form, bulan: e.target.value })} style={inputStyle} required>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    min="2000" 
                    placeholder={currentYear.toString()} 
                    value={form.tahun} 
                    onChange={e => setForm({ ...form, tahun: e.target.value })} 
                    style={inputStyle} 
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD TIPE RCT */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH TIPE RCT</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tipe RCT <span className="text-rose-500">*</span></label>
              <select value={form.tipe_rct} onChange={e => setForm({ ...form, tipe_rct: e.target.value })} style={inputStyle} required>
                <option value="">-- Pilih Tipe RCT --</option>
                {TIPE_RCT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* CARD DETAIL DATA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL DATA MVOD</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0"><Clock size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Rata-rata (Menit) <span className="text-rose-500">*</span></label>
                </div>
                <div className="w-[140px]">
                  <input type="number" step="0.01" min="0" className={fieldInputClass} placeholder="0" value={form.rata_rata} onChange={e => setForm({ ...form, rata_rata: e.target.value })} required />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Kali Padam <span className="text-rose-500">*</span></label>
                </div>
                <div className="w-[140px]">
                  <input type="number" min="1" className={fieldInputClass} placeholder="0" value={form.kali} onChange={e => setForm({ ...form, kali: e.target.value })} required />
                </div>
              </div>

            </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: saving ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
          >
            {saving ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            Simpan Data
          </button>

        </form>
      </div>
    </div>
  )
}
