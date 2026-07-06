import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const MONTHS_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmt = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID');
};

export default function DetailGangguanTmModal({ open, onOpenChange, tahun, bulan, targetTahunan, totalKejadian }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/jaringan/gangguan-tm/lebih-5/detail', {
          params: { tahun, bulan }
        });
        setData(response.data.data || []);
      } catch (error) {
        console.error('Error fetching details', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && tahun && bulan) {
      fetchData();
    }
  }, [open, tahun, bulan]);

  if (!open) return null;

  const monthName = MONTHS_FULL[parseInt(bulan)] || bulan;

  const closeModal = () => onOpenChange(false);
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleEditData = () => {
    navigate('/jaringan/gangguan-tm/edit-lebih-5-menit', { state: { initialMonth: bulan, initialYear: tahun } });
    closeModal();
  };

  const isAdmin = user?.role === 'pic_pemasaran' || user?.role === 'admin';

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" 
      onClick={handleOverlayClick}
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div 
        className="w-full animate-scale-in flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxWidth: 520,
          maxHeight: '90vh'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
              <Calendar size={18} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                Rincian Gangguan &gt; 5 Menit
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 4 }}>
                {monthName} {tahun}
              </p>
            </div>
          </div>
          <button 
            onClick={closeModal} 
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* INFO RINGKAS */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Target Tahunan:{' '}
            <strong style={{ color: '#0f172a' }}>{fmt(targetTahunan)}</strong>
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Realisasi Bulan Ini:{' '}
            <strong style={{ color: '#0f172a' }}>
              {fmt(totalKejadian)}
            </strong>
          </span>
        </div>

        {/* ACCORDION LIST / ITEM */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>GANGGUAN &gt; 5 MENIT</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(totalKejadian)} Kali</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '40vh', paddingRight: '4px', marginTop: '12px' }} className="custom-scrollbar">
            {loading ? (
               <div className="py-4 text-center text-sm text-slate-500">Memuat rincian data...</div>
            ) : data.length > 0 ? (
               <div className="flex flex-col gap-2">
                  {data.map((item, idx) => (
                     <div key={item.id || idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                           <div className="font-semibold text-slate-800 text-sm">{item.penyebab || 'Tanpa Keterangan'}</div>
                           <div className="text-xs text-slate-500 mt-0.5">{item.nama_penyulang || '-'}</div>
                        </div>
                        <div className="font-bold text-red-600 text-sm whitespace-nowrap ml-3 mt-0.5">
                           {item.jumlah_gangguan} Kali
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="py-4 text-center text-sm text-slate-400">Tidak ada rincian kejadian.</div>
            )}
          </div>
        </div>
        
        {/* FOOTER */}
        <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
          <button
            onClick={handleEditData}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0',
              borderRadius: 10,
              border: '1.5px solid #2563eb',
              background: 'transparent',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Edit2 size={16} />
            Edit Data
          </button>
        </div>

      </div>
    </div>
  );
}
