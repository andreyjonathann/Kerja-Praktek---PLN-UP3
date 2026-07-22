import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import { ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

const STATUS_OPTIONS = [
  { value: 'Proses', label: 'Proses', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '⏳' },
  { value: 'Terkontrak (Tanda Tangan)', label: 'Terkontrak', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: '✅' },
  { value: 'Batal', label: 'Batal', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: '❌' },
];

export default function UbahStatusPengadaanPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [currentStatus, setCurrentStatus] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [uraian, setUraian] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/v1/pengadaan/${id}`);
        const d = res.data?.data;
        if (d) {
          setCurrentStatus(d.status || 'Proses');
          setSelectedStatus(d.status || 'Proses');
          setUraian(d.uraian_pekerjaan || `Kontrak #${id}`);
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data kontrak tidak ditemukan.' });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (selectedStatus === currentStatus) {
      Swal.fire({ icon: 'info', title: 'Tidak Ada Perubahan', text: 'Status yang dipilih sama dengan status saat ini.', timer: 1500, showConfirmButton: false });
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/v1/pengadaan/${id}/status`, { status: selectedStatus });
      Swal.fire({
        icon: 'success',
        title: 'Status Berhasil Diubah',
        text: `Status diubah menjadi "${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}"`,
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => navigate('/pengadaan/kontrak'), 1500);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal mengubah status.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} className="animate-spin text-pln-blue-mid" />
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Ubah Status Kontrak
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Perbarui status pekerjaan pengadaan
            </p>
          </div>
        </div>

        {/* INFO KONTRAK */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Uraian Pekerjaan</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{uraian}</p>
          </div>
          <div className="p-4">
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Status Saat Ini</p>
            <div style={{ marginTop: 6 }}>
              {(() => {
                const cfg = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* PILIH STATUS BARU */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><RefreshCw size={16} /></div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH STATUS BARU</h3>
          </div>
          <div className="p-5">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STATUS_OPTIONS.map(opt => {
                const isSelected = selectedStatus === opt.value;
                const isCurrent = currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                      fontSize: '0.92rem', fontWeight: 700, textAlign: 'left',
                      transition: 'all 0.2s ease',
                      border: isSelected ? `2.5px solid ${opt.color}` : '2.5px solid #e2e8f0',
                      background: isSelected ? opt.bg : '#fafbfc',
                      color: isSelected ? opt.color : '#64748b',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? `0 4px 12px ${opt.border}` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div>{opt.label}</div>
                      {isCurrent && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                          (Status saat ini)
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle size={20} style={{ color: opt.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || selectedStatus === currentStatus}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px 24px', borderRadius: 12,
            fontSize: '0.95rem', fontWeight: 700, cursor: saving || selectedStatus === currentStatus ? 'not-allowed' : 'pointer',
            border: 'none', color: 'white',
            background: saving || selectedStatus === currentStatus
              ? '#cbd5e1'
              : 'linear-gradient(135deg, #14A2BA 0%, #0D9488 100%)',
            boxShadow: saving || selectedStatus === currentStatus
              ? 'none'
              : '0 4px 14px rgba(20,162,186,0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
          ) : (
            <><CheckCircle size={18} /> Simpan Perubahan Status</>
          )}
        </button>

      </div>
    </div>
  );
}
