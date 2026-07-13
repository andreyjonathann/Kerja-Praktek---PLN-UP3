import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '@/services/api'
import Swal from 'sweetalert2'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Activity, ArrowLeft, Target, AlertTriangle, Save, Loader2, Info, Calendar, FileText, Trash2, CheckCircle } from 'lucide-react'
import TargetWarning from '@/components/ui/TargetWarning'

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function EditGangguanSwitchingPage({ isInline = false, inlineMonth = null, onSuccess, onCancel }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { filters } = useFilter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // States
  const up3 = user?.up3 || DEFAULT_UP3;
  const year = filters.year || new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const initialMonth = isInline ? inlineMonth : (location.state?.initialMonth || '');
  
  const [target, setTarget] = useState(null)
  
  const [switchingForm, setSwitchingForm] = useState({
    tahun: year,
    bulan: initialMonth,
    details: [],
    existingId: null
  })
  
  const [notification, setNotification] = useState(null)

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchTargetAndData = useCallback(async () => {
    if (!switchingForm.tahun) return;
    setLoading(true);
    try {
      // 1. Fetch Target
      const resTarget = await api.get(`/target/jaringan/${encodeURIComponent('Gangguan Switching')}?tahun=${switchingForm.tahun}`);
      if (resTarget.data) {
        setTarget(resTarget.data);
      } else {
        setTarget(null);
      }

      // 2. Fetch Existing Data for selected month
      const resSw = await api.get(`/v1/gangguan-switching?tahun=${switchingForm.tahun}&up3=${up3}`);
      
      const swData = resSw.data?.data || [];
      
      // Look for switching record for current selected month
      const currentSw = swData.find(item => item.bulan == switchingForm.bulan);
      if (currentSw) {
        setSwitchingForm(prev => ({ ...prev, tahun: currentSw.tahun, details: currentSw.details || [], existingId: currentSw.id }));
      } else {
        setSwitchingForm(prev => ({ ...prev, details: [], existingId: null }));
      }

    } catch (error) {
      console.error(error);
      showNotification('error', 'Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  }, [switchingForm.tahun, up3, switchingForm.bulan]);

  useEffect(() => {
    fetchTargetAndData();
  }, [fetchTargetAndData]);

  const handleSwitchingChange = (e) => {
    const { name, value } = e.target;
    setSwitchingForm(prev => ({ ...prev, [name]: value }));
  };

  const addDetail = () => {
    setSwitchingForm(prev => ({ ...prev, details: [...prev.details, { merek: '', tahun_alat: '', nomor_seri: '' }] }));
  };

  const removeDetail = (index) => {
    setSwitchingForm(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...switchingForm.details];
    newDetails[index][field] = value;
    setSwitchingForm(prev => ({ ...prev, details: newDetails }));
  };

  const submitSwitching = async (e) => {
    e?.preventDefault();
    setSaving(true);
    if (!switchingForm.tahun) {
      showNotification('error', 'Tahun wajib diisi');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        up3,
        tahun: Number(switchingForm.tahun),
        bulan: Number(switchingForm.bulan),
        details: switchingForm.details
      };
      
      let res;
      if (switchingForm.existingId) {
        res = await api.put(`/v1/gangguan-switching/${switchingForm.existingId}`, payload);
      } else {
        res = await api.post(`/v1/gangguan-switching`, payload);
      }
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data kejadian berhasil diupdate.',
          timer: 1500,
          showConfirmButton: false
        })
        setTimeout(() => {
          if (isInline && onSuccess) onSuccess();
          else navigate('/jaringan/gangguan-switching');
        }, 1500)
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async () => {
    if (!switchingForm.existingId) return;
    
    const confirm = await Swal.fire({
      title: 'Hapus Data Bulan Ini?',
      text: `Semua data kejadian Switching bulan ${MONTHS_FULL[Number(switchingForm.bulan) - 1]} ${switchingForm.tahun} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        setSaving(true);
        const res = await api.delete(`/v1/gangguan-switching/${switchingForm.existingId}`);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Terhapus!',
            text: 'Data berhasil dihapus.',
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            if (isInline && onSuccess) onSuccess();
            else navigate('/jaringan/gangguan-switching');
          }, 1500);
        }
      } catch (err) {
        console.error("Gagal menghapus:", err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.response?.data?.message || 'Terjadi kesalahan saat menghapus data'
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const isDuplicate = !!switchingForm.existingId && switchingForm.details.length > 0;

  return (
    <div className={isInline ? "animate-fade-in" : "min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12"}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: isInline ? '0' : '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              if (isInline && onCancel) onCancel();
              else navigate(-1);
            }}
            title="Kembali"
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary, #64748b)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, #00A2B922, #00A2B90a)`,
            border: `1px solid #00A2B930`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={17} style={{ color: '#00A2B9' }} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
              Edit Gangguan Switching — {switchingForm.bulan ? MONTHS_FULL[Number(switchingForm.bulan) - 1] : ''} {switchingForm.tahun}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Satuan: Kali
            </p>
          </div>
        </div>

        {/* NOTIFICATION */}
        {notification && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            color: notification.type === 'error' ? '#dc2626' : '#16a34a',
            fontWeight: 600, fontSize: '0.86rem',
          }}>
            {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            {notification.message}
          </div>
        )}

        <TargetWarning 
          up3={up3.replace(/^UP3\s+/i, '')} 
          year={year} 
          monthName={switchingForm.bulan ? MONTHS_FULL[Number(switchingForm.bulan) - 1] : null}
          isVisible={!loading && (!target || (switchingForm.bulan && target[`target_${['jan','feb','mar','apr','mei','jun','jul','agu','sep','okt','nov','des'][Number(switchingForm.bulan)-1]}`] === null))} 
        />

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: '#94a3b8' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 600 }}>Memuat data...</span>
          </div>
        ) : (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* TOTAL PREVIEW */}
            <div style={{
              padding: '13px 18px', borderRadius: 12,
              background: `linear-gradient(135deg, #00A2B912, #00A2B905)`,
              border: `1px solid #00A2B928`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                Total Gangguan (preview)
              </span>
              <span style={{ fontSize: '1.18rem', fontWeight: 800, color: '#00A2B9' }}>
                {switchingForm.details.length}
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted, #94a3b8)', marginLeft: 6, fontWeight: 600 }}>
                  Kali
                </span>
              </span>
            </div>

            {/* CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINCIAN KEJADIAN</h3>
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-4">
                {/* PILIH PERIODE */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                    <select
                      name="bulan"
                      value={switchingForm.bulan}
                      onChange={handleSwitchingChange}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                        fontSize: '0.92rem', fontWeight: 600, outline: 'none'
                      }}
                    >
                      <option value="" disabled>Pilih Bulan</option>
                      {MONTHS_FULL.map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                    <input
                      type="number"
                      name="tahun"
                      value={switchingForm.tahun}
                      onChange={handleSwitchingChange}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                        fontSize: '0.92rem', fontWeight: 600, outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* LIST ALAT */}
              <div className="bg-slate-50/50 p-5 border-t border-slate-100">
                <div className="space-y-4">
                  {switchingForm.details.map((detail, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-white flex items-start gap-4 shadow-sm">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Merek</label>
                          <input
                            type="text"
                            placeholder="Cth: Schneider"
                            value={detail.merek}
                            onChange={(e) => handleDetailChange(index, 'merek', e.target.value)}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                              fontSize: '0.85rem', fontWeight: 500, outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Tahun Alat</label>
                          <input
                            type="text"
                            placeholder="Cth: 2015"
                            value={detail.tahun_alat}
                            onChange={(e) => handleDetailChange(index, 'tahun_alat', e.target.value)}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                              fontSize: '0.85rem', fontWeight: 500, outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Nomor Seri</label>
                          <input
                            type="text"
                            placeholder="Cth: SN-123456"
                            value={detail.nomor_seri}
                            onChange={(e) => handleDetailChange(index, 'nomor_seri', e.target.value)}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                              fontSize: '0.85rem', fontWeight: 500, outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDetail(index)}
                        style={{
                          marginTop: 20, padding: 8, color: '#94a3b8',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderRadius = '8px' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
                        title="Hapus baris ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {switchingForm.details.length === 0 && (
                    <div className="text-center py-8 border border-slate-200 border-dashed rounded-xl">
                      <p className="text-sm font-medium text-slate-500">Belum ada data gangguan.</p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addDetail}
                    style={{
                      width: '100%', padding: '10px 0', marginTop: 4,
                      background: '#f0f9ff', color: '#0284c7', border: '1px dashed #bae6fd',
                      borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
                  >
                    + Tambah Kejadian
                  </button>
                </div>
              </div>
            </div>

            {isDuplicate && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 mt-2">
                <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-blue-700 text-sm font-medium leading-relaxed">
                  Data bulan ini sudah ada di database. Anda dapat mengedit alat yang ada atau menghapusnya.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {isDuplicate && (
                <button
                  type="button"
                  onClick={handleDeleteParent}
                  disabled={saving}
                  style={{
                    flex: '0 0 auto',
                    padding: '0 20px', borderRadius: 10,
                    border: '1px solid #fecaca', background: '#fef2f2',
                    color: '#dc2626', fontWeight: 700, fontSize: '0.9rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              )}
              <button
                type="button"
                onClick={submitSwitching}
                disabled={saving || !switchingForm.bulan}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: 'none', background: '#00A2B9',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  cursor: (saving || !switchingForm.bulan) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !switchingForm.bulan) ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(0, 162, 185, 0.25)'
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Perubahan
              </button>
            </div>
            
          </form>
        )}
      </div>
    </div>
  );
}
