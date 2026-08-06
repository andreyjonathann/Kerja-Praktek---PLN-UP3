import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Activity, Calendar, Zap, Clock, AlertTriangle } from 'lucide-react'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard'

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
  const [existingData, setExistingData] = useState([]);

  const { isDirty, setIsDirty, guardedNavigate } = useDirtyFormGuard();
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (!form.tahun) return;
    api.get(`/v1/mvod?tahun=${form.tahun}&up3=${user?.up3 || DEFAULT_UP3}`)
      .then(res => setExistingData(res.data?.data || []))
      .catch(() => setExistingData([]));
  }, [form.tahun, user?.up3]);

  const matchingRecord = React.useMemo(() => {
    if (!form.bulan || !form.tipe_rct) return null;
    return existingData.find(d => d.bulan == form.bulan && d.tipe_rct === form.tipe_rct) || null;
  }, [form.bulan, form.tipe_rct, existingData]);

  const isDuplicate = !!matchingRecord;

  useEffect(() => {
    if (matchingRecord) {
      setForm(prev => ({
        ...prev,
        rata_rata: matchingRecord.rata_rct_menit != null ? matchingRecord.rata_rct_menit.toString() : '',
        kali: matchingRecord.kali_padam != null ? matchingRecord.kali_padam.toString() : ''
      }));
    } else if (form.bulan && form.tipe_rct) {
      setForm(prev => ({ ...prev, rata_rata: '', kali: '' }));
    }
  }, [matchingRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isDuplicate) {
      notify.warning('Data untuk kombinasi bulan dan tipe RCT ini sudah ada. Silakan gunakan fitur Edit.');
      return;
    }
    if (!form.tahun || !form.bulan || !form.tipe_rct || form.rata_rata === '' || form.kali === '') return notify.warning('Semua field wajib diisi!')
    if (Number(form.rata_rata) < 0 || Number(form.kali) < 0) return notify.warning('Angka tidak boleh negatif!')
    if (Number(form.kali) < 1) return notify.warning('Kali padam minimal 1!')

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
      setIsDirty(false)
      navigate('/jaringan/mvod')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.')
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
          <button type="button" onClick={() => guardedNavigate(() => navigate(-1), isDuplicate)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Tambah Realisasi MVOD</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Masukkan data Mean Value of Outage Duration</p>
          </div>
        </div>

        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertTriangle size={16} /> Data untuk kombinasi bulan dan tipe RCT ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}

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
                  <select value={form.bulan} onChange={e => handleFieldChange('bulan', e.target.value)} style={inputStyle} required>
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
                    onChange={e => handleFieldChange('tahun', e.target.value)} 
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
              <select value={form.tipe_rct} onChange={e => handleFieldChange('tipe_rct', e.target.value)} style={inputStyle} required>
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
                  <input type="number" step="0.01" min="0" readOnly={isDuplicate} className={fieldInputClass} placeholder="0" value={form.rata_rata} onChange={e => handleFieldChange('rata_rata', e.target.value)} required style={isDuplicate ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Kali Padam <span className="text-rose-500">*</span></label>
                </div>
                <div className="w-[140px]">
                  <input type="number" min="1" readOnly={isDuplicate} className={fieldInputClass} placeholder="0" value={form.kali} onChange={e => handleFieldChange('kali', e.target.value)} required style={isDuplicate ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}} />
                </div>
              </div>

            </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={saving || isDuplicate}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (saving || isDuplicate) ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (saving || isDuplicate) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (saving || isDuplicate) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
          >
            {saving ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  )
}
