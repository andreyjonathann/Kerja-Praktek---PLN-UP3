import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertCircle, Save, ChevronDown, Plus, Trash2, ArrowLeft, Activity, AlertTriangle } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputGangguanTmLebih5Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingData, setExistingData] = useState({ lebih: false });

  const { register, handleSubmit, formState: { errors }, control, watch } = useForm({
      defaultValues: {
          tahun: '',
          bulan: '',
          kejadian: [{ jumlah: '', penyebab: '', penyulang: '' }]
      }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'kejadian' });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');

  const MONTHS = [
      { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
      { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
      { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
      { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
      { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      setExistingData({ lebih: false });
      return;
    }
    const fetchData = async () => {
      try {
        const res = await api.get('/jaringan/gangguan-tm/rekap', { params: { tahun: selectedYear } });
        const rekap = res.data;
        if (rekap && rekap['lebih_5_mnt']) {
          const dataBulan = rekap['lebih_5_mnt'].monthly[parseInt(selectedMonth)];
          setExistingData({ lebih: dataBulan !== null && dataBulan !== undefined });
        } else {
          setExistingData({ lebih: false });
        }
      } catch (err) {
        console.error(err);
        setExistingData({ lebih: false });
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  const isDuplicate = existingData.lebih;

  const onSubmit = async (data) => {
    if (isDuplicate) {
      alert('Data untuk periode ini sudah ada! Tidak bisa mengedit dari halaman Tambah.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
          bulan: parseInt(data.bulan),
          tahun: parseInt(data.tahun),
          kejadian: data.kejadian.map(k => ({
              jumlah: parseInt(k.jumlah),
              penyebab: k.penyebab || '',
              penyulang: k.penyulang || ''
          }))
      };
      
      await api.post('/jaringan/gangguan-tm/lebih-5', payload);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        navigate('/jaringan/gangguan-tm');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'pic_pemasaran') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-none flex items-center justify-center mb-8 shadow-inner">
                 <AlertCircle size={48} className="text-slate-400" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Gangguan TM &gt; 5 Menit</h1>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.85rem', fontWeight: 600, color: '#64748b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Tambah Gangguan TM &gt; 5 Menit
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* NOTIFICATION */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: '#f0fdf4',
            border: `1px solid #bbf7d0`,
            color: '#16a34a',
            fontWeight: 600, fontSize: '0.86rem',
          }}>
            <CheckCircle size={16} />
            Data Berhasil Disimpan!
          </div>
        )}

        <TargetWarning 
            up3={user?.up3 || 'UP3 Kebon Jeruk'} 
            year={selectedYear} 
            monthName={selectedMonth ? MONTHS.find(m => m.value == selectedMonth)?.label : null} 
            isVisible={false} 
        />

        {isDuplicate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: '#fef2f2', border: `1px solid #fecaca`,
            color: '#dc2626', fontWeight: 600, fontSize: '0.86rem',
            marginBottom: 4
          }}>
            <AlertTriangle size={16} />
            Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>
          
          {/* CARD PERIODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
              </div>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                  <select
                    {...register('bulan', { required: true })} 
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #e2e8f0', background: '#f8fafc',
                      fontSize: '0.9rem', color: '#334155', outline: 'none',
                    }}
                  >
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input 
                    readOnly={isDuplicate}
                    type="number"
                    {...register('tahun', { required: true })} 
                    placeholder="Tahun"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #e2e8f0', background: isDuplicate ? '#f1f5f9' : '#f8fafc',
                      fontSize: '0.9rem', color: '#334155', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {(errors.bulan || errors.tahun) && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Wajib pilih bulan dan tahun!
                </div>
              )}
            </div>
          </div>

          {/* CARD GANGGUAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL KEJADIAN GANGGUAN</h3>
                </div>
             </div>
             
             <div className="p-5 flex flex-col gap-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                     {fields.length > 1 && (
                       <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                       >
                          <Trash2 size={18} />
                       </button>
                     )}
                     <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                           Jumlah (Kali)
                        </label>
                        <input 
                          readOnly={isDuplicate}
                          type="number" min="1"
                           {...register(`kejadian.${index}.jumlah`, { required: true })}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-[13px]"
                           placeholder="Contoh: 1"
                        />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                           Penyebab
                        </label>
                        <input 
                           type="text"
                           readOnly={isDuplicate}
                           {...register(`kejadian.${index}.penyebab`)}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-[13px]"
                           placeholder="Penyebab gangguan..."
                        />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                           Nama Penyulang
                        </label>
                        <input 
                           type="text"
                           readOnly={isDuplicate}
                           {...register(`kejadian.${index}.penyulang`)}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-[13px]"
                           placeholder="Nama penyulang..."
                        />
                     </div>
                  </div>
                ))}

                {!isDuplicate && (
                  <button 
                     type="button"
                     onClick={() => append({ jumlah: '', penyebab: '', penyulang: '' })}
                     className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-[13px]"
                  >
                     <Plus size={16} />
                     Tambah Kejadian
                  </button>
                )}
             </div>
          </div>

          <button
            type="submit"
            disabled={loading || isDuplicate}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: (loading || isDuplicate) ? '#93c5fd' : '#3b82f6', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: (loading || isDuplicate) ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <div style={{width: 20, height: 20, border: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /> : <Save size={18} />}
            {isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
