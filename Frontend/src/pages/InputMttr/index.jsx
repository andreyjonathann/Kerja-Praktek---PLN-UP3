import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Activity, Calendar, Zap, AlertTriangle } from 'lucide-react'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
]

const JENIS_ASET = [
  { value: 'SUTM', label: 'SUTM' },
  { value: 'SKTM', label: 'SKTM' },
  { value: 'PHBTM', label: 'PHBTM' },
  { value: 'TRAFO', label: 'TRAFO' }
]

export default function InputMttrPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const currentYear = new Date().getFullYear()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tahun: currentYear, bulan: '', jenis_aset: '', terpenuhi: '', total: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tahun || !form.bulan || !form.jenis_aset || form.terpenuhi === '' || form.total === '') return alert('Semua field wajib diisi!')
    if (Number(form.terpenuhi) < 0 || Number(form.total) < 0) return alert('Angka tidak boleh negatif!')
    if (Number(form.terpenuhi) > Number(form.total)) return alert('Jumlah terpenuhi tidak boleh lebih besar dari jumlah total!')

    setSaving(true)
    try {
      const payload = {
        up3: user?.up3 || 'UP3 Kebon Jeruk',
        tahun: Number(form.tahun),
        bulan: Number(form.bulan),
        aset: [
          {
            jenis_aset: form.jenis_aset,
            terpenuhi: Number(form.terpenuhi),
            total: Number(form.total)
          }
        ]
      }
      await api.post('/v1/mttr', payload)
      navigate('/jaringan/mttr-siaga1')
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
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Tambah Realisasi MTTR Siaga 1</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Masukkan data Mean Time To Restore Siaga 1</p>
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

          {/* CARD JENIS ASET */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH JENIS ASET</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Jenis Aset <span className="text-rose-500">*</span></label>
              <select value={form.jenis_aset} onChange={e => setForm({ ...form, jenis_aset: e.target.value })} style={inputStyle} required>
                <option value="">-- Pilih Jenis Aset --</option>
                {JENIS_ASET.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          {/* CARD DETAIL DATA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Zap size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL DATA MTTR SIAGA 1</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0"><Activity size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Siaga 1 Terpenuhi <span className="text-rose-500">*</span></label>
                </div>
                <div className="w-[140px]">
                  <input type="number" min="0" className={fieldInputClass} placeholder="0" value={form.terpenuhi} onChange={e => setForm({ ...form, terpenuhi: e.target.value })} required />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Siaga 1 Total <span className="text-rose-500">*</span></label>
                </div>
                <div className="w-[140px]">
                  <input type="number" min="0" className={fieldInputClass} placeholder="0" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} required />
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
