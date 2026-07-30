import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '@/services/api'
import Swal from 'sweetalert2'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Activity, ArrowLeft, Target, AlertTriangle, Save, Loader2, Info, Calendar, FileText, Trash2, CheckCircle } from 'lucide-react'
import TargetWarning from '@/components/ui/TargetWarning'
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard'

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function EditGangguanTrafoPage({ isInline = false, inlineMonth = null, onSuccess, onCancel }) {
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
  
  const [trafoForm, setTrafoForm] = useState({
    tahun: year,
    bulan: initialMonth,
    jumlah_gangguan: '',
    existingId: null
  })

  const { isDirty, setIsDirty, guardedNavigate } = useDirtyFormGuard();
  
  const [notification, setNotification] = useState(null)

  const fetchTargetAndData = useCallback(async () => {
    if (!trafoForm.tahun) return;
    setLoading(true);
    try {
      // 1. Fetch Target
      const resTarget = await api.get(`/target/jaringan/${encodeURIComponent('Gangguan Trafo')}?tahun=${trafoForm.tahun}`);
      if (resTarget.data) {
        setTarget(resTarget.data);
      } else {
        setTarget(null);
      }

      // 2. Fetch Existing Data for selected month
      const resTr = await api.get(`/v1/gangguan-trafo?tahun=${trafoForm.tahun}&up3=${up3}`);
      
      const trData = resTr.data?.data || [];
      
      // Look for trafo record for current selected month
      const currentTr = trData.find(item => item.bulan == trafoForm.bulan);
      if (currentTr) {
        setTrafoForm(prev => ({ ...prev, tahun: currentTr.tahun, jumlah_gangguan: currentTr.jumlah_gangguan, existingId: currentTr.id }));
      } else {
        setTrafoForm(prev => ({ ...prev, jumlah_gangguan: '', existingId: null }));
      }

    } catch (error) {
      console.error(error);
      showNotification('error', 'Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  }, [trafoForm.tahun, up3, trafoForm.bulan]);

  useEffect(() => {
    fetchTargetAndData();
  }, [fetchTargetAndData]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTrafoChange = (e) => {
    const { name, value } = e.target;
    setTrafoForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };



  const submitTrafo = async (e) => {
    e?.preventDefault();
    setSaving(true);
    if (!trafoForm.tahun) {
      showNotification('error', 'Tahun wajib diisi');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        up3,
        tahun: Number(trafoForm.tahun),
        bulan: Number(trafoForm.bulan),
        jumlah_gangguan: Number(trafoForm.jumlah_gangguan)
      };
      
      let res;
      if (trafoForm.existingId) {
        res = await api.put(`/v1/gangguan-trafo/${trafoForm.existingId}`, payload);
      } else {
        res = await api.post(`/v1/gangguan-trafo`, payload);
      }
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data kejadian Trafo berhasil diupdate.',
          timer: 1500,
          showConfirmButton: false
        })
        setIsDirty(false);
        setTimeout(() => {
          if (isInline && onSuccess) onSuccess();
          else navigate('/jaringan/gangguan-switching');
        }, 1500)
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyimpan data.'
      })
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async () => {
    if (!trafoForm.existingId) return;
    
    const confirm = await Swal.fire({
      title: 'Hapus Data Bulan Ini?',
      text: `Semua data kejadian Trafo bulan ${MONTHS_FULL[Number(trafoForm.bulan) - 1]} ${trafoForm.tahun} akan dihapus.`,
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
        const res = await api.delete(`/v1/gangguan-trafo/${trafoForm.existingId}`);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Terhapus!',
            text: 'Data berhasil dihapus.',
            timer: 1500,
            showConfirmButton: false
          });
          setIsDirty(false);
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

  const isDuplicate = !!trafoForm.existingId && Number(trafoForm.jumlah_gangguan) > 0;

  return (
    <div className={isInline ? "animate-fade-in" : "min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12"}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: isInline ? '0' : '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              guardedNavigate(() => {
                if (isInline && onCancel) onCancel();
                else navigate(-1);
              });
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
            background: `linear-gradient(135deg, #f9731622, #f973160a)`,
            border: `1px solid #f9731630`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={17} style={{ color: '#f97316' }} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
              Edit Gangguan Trafo — {trafoForm.bulan ? MONTHS_FULL[Number(trafoForm.bulan) - 1] : ''} {trafoForm.tahun}
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
            {notification.type === 'error' ? <AlertTriangle size={16} /> : <Activity size={16} />}
            {notification.message}
          </div>
        )}

        <TargetWarning 
          up3={up3.replace(/^UP3\s+/i, '')} 
          year={year} 
          monthName={trafoForm.bulan ? MONTHS_FULL[Number(trafoForm.bulan) - 1] : null}
          isVisible={!loading && (!target || (trafoForm.bulan && target[`target_${['jan','feb','mar','apr','mei','jun','jul','agu','sep','okt','nov','des'][Number(trafoForm.bulan)-1]}`] === null))} 
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
              background: `linear-gradient(135deg, #f9731612, #f9731605)`,
              border: `1px solid #f9731628`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                Total Gangguan (preview)
              </span>
              <span style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f97316' }}>
                {trafoForm.jumlah_gangguan || '0'}
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted, #94a3b8)', marginLeft: 6, fontWeight: 600 }}>
                  Kali
                </span>
              </span>
            </div>

            {/* CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL GANGGUAN</h3>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {/* PILIH PERIODE */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                    <select
                      name="bulan"
                      value={trafoForm.bulan}
                      onChange={handleTrafoChange}
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
                      value={trafoForm.tahun}
                      onChange={handleTrafoChange}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                        fontSize: '0.92rem', fontWeight: 600, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ paddingTop: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>
                    Jumlah Gangguan Trafo (Kali)
                  </label>
                  <input
                    type="number"
                    name="jumlah_gangguan"
                    value={trafoForm.jumlah_gangguan}
                    onChange={handleTrafoChange}
                    min="0"
                    placeholder="0"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
                      fontSize: '0.92rem', fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {isDuplicate && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 mt-2">
                <Info size={18} className="text-orange-500 mt-0.5 shrink-0" />
                <p className="text-orange-700 text-sm font-medium leading-relaxed">
                  Data trafo bulan ini sudah ada. Anda dapat mengedit jumlah gangguan atau menghapusnya.
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
                onClick={submitTrafo}
                disabled={saving || !trafoForm.bulan}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: 'none', background: '#00A2B9',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  cursor: (saving || !trafoForm.bulan) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !trafoForm.bulan) ? 0.7 : 1,
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
