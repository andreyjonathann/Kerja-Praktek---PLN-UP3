import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { ArrowLeft, Save, Edit2, ChevronDown, CheckCircle } from 'lucide-react';

const MONTHS = [
  { key: 'target_jan', label: 'Januari' },
  { key: 'target_feb', label: 'Februari' },
  { key: 'target_mar', label: 'Maret' },
  { key: 'target_apr', label: 'April' },
  { key: 'target_mei', label: 'Mei' },
  { key: 'target_jun', label: 'Juni' },
  { key: 'target_jul', label: 'Juli' },
  { key: 'target_agu', label: 'Agustus' },
  { key: 'target_sep', label: 'September' },
  { key: 'target_okt', label: 'Oktober' },
  { key: 'target_nov', label: 'November' },
  { key: 'target_des', label: 'Desember' }
];

export default function KelolaTargetBulananPage() {
  const { bidang, indikator } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTahun = searchParams.get('tahun') ? parseInt(searchParams.get('tahun')) : new Date().getFullYear();

  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [tahun, setTahun] = useState(initialTahun);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({});
  
  const [form, setForm] = useState({
    target_jan: '', target_feb: '', target_mar: '', target_apr: '', target_mei: '', target_jun: '',
    target_jul: '', target_agu: '', target_sep: '', target_okt: '', target_nov: '', target_des: ''
  });

  const displayBidang = bidang.toUpperCase();
  const displayIndikator = indikator.toUpperCase();

  // Determine step based on indikator (assuming SAIDI/SAIFI/ENS allow decimals, others integers)
  const isDecimal = ['SAIDI', 'SAIFI', 'ENS'].includes(displayIndikator);
  const step = isDecimal ? "0.0001" : "1";

  useEffect(() => {
    if (!isAdmin) return;
    if (String(tahun).length !== 4) return;

    
    const fetchTarget = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/target/${bidang}/${indikator}?tahun=${tahun}`);
        const data = res.data;
        const newForm = {};
        MONTHS.forEach(m => {
          newForm[m.key] = data[m.key] !== null && data[m.key] !== undefined ? String(data[m.key]) : '';
        });
        setForm(newForm);
        setOriginalForm(newForm);
        setIsEditing(false);
      } catch (err) {
        console.error('Failed to fetch target:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTarget();
  }, [tahun, bidang, indikator, isAdmin]);

  if (authLoading) return null;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      MONTHS.forEach(m => {
        payload[m.key] = form[m.key] === '' ? null : parseFloat(form[m.key]);
      });

      await api.put(`/target/${bidang}/${indikator}/${tahun}`, payload);
      
      setSuccessMsg(`Target Bulanan ${displayIndikator} berhasil disimpan!`);
      setIsEditing(false);
      setOriginalForm({...form});
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Gagal menyimpan target: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/kelola-target?bidang=${bidang}`)}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              Target {displayIndikator}
            </h1>
            <p className="text-sm font-medium text-slate-500">Pengisian target bulanan untuk UP3 Kebon Jeruk</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700 text-sm">Tahun:</label>
            <div className="relative">
              <input
                type="number"
                value={tahun}
                onChange={(e) => {
                  const val = e.target.value;
                  if(val.length <= 4) setTahun(val);
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!val || val < 2000) setTahun(new Date().getFullYear());
                  else setTahun(val);
                }}
                disabled={isEditing}
                min="2000"
                max="2100"
                className="w-24 pl-4 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none font-bold text-slate-800 disabled:opacity-50 transition-all text-center"
              />
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-3">
             {!isEditing ? (
               <div style={{
                 display: 'inline-flex',
                 background: '#00A2B9',
                 padding: 4,
                 borderRadius: 12,
                 border: 'none',
                 cursor: 'pointer'
               }}>
                 <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 9,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: 'pointer',
                      background: '#00A2B9',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 162, 185, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                 >
                    <Edit2 size={16} />
                    Edit Target
                 </button>
               </div>
             ) : (
               <>
                 <div style={{
                   display: 'inline-flex',
                   background: 'transparent',
                   padding: 4,
                   borderRadius: 12,
                   border: '1px solid #e2e8f0',
                   cursor: 'pointer'
                 }}>
                   <button 
                      type="button"
                      onClick={() => {
                        setForm(originalForm);
                        setIsEditing(false);
                      }}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 9,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => {
                           e.currentTarget.style.background = '#f1f5f9';
                           e.currentTarget.style.color = '#334155';
                      }}
                      onMouseLeave={e => {
                           e.currentTarget.style.background = 'transparent';
                           e.currentTarget.style.color = '#64748b';
                      }}
                   >
                      Batal
                   </button>
                 </div>
                 <div style={{
                   display: 'inline-flex',
                   background: saving ? '#93c5fd' : '#00A2B9',
                   padding: 4,
                   borderRadius: 12,
                   border: 'none',
                   cursor: saving ? 'not-allowed' : 'pointer',
                   opacity: saving ? 0.6 : 1
                 }}>
                   <button 
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 9,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        background: saving ? '#93c5fd' : '#00A2B9',
                        color: '#ffffff',
                        boxShadow: saving ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                   >
                      {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                      Simpan
                   </button>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8 mt-2">
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
            <CheckCircle className="text-emerald-500 shrink-0" size={24} />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 text-center">
              <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">Target Bulanan — {tahun}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-6 font-bold text-sm text-slate-600 w-1/3 text-center">Bulan</th>
                    <th className="py-3 px-6 font-bold text-sm text-slate-600 w-1/3 text-center">Target</th>
                    <th className="py-3 px-6 font-bold text-sm text-slate-600 w-1/3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS.map((m, idx) => {
                    const isFilled = form[m.key] !== '';
                    return (
                      <tr key={m.key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-slate-800 align-middle text-center">
                          {m.label}
                        </td>
                        <td className="py-3 px-6 align-middle text-center">
                          <input
                            type="number"
                            step={step}
                            placeholder="-"
                            value={form[m.key]}
                            disabled={!isEditing}
                            onChange={(e) => handleChange(m.key, e.target.value)}
                            className={`w-full max-w-[200px] mx-auto px-3 py-2 border rounded-lg font-bold outline-none transition-all text-center ${
                              isEditing 
                                ? 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white' 
                                : 'border-transparent text-slate-700 bg-transparent cursor-default'
                            }`}
                          />
                        </td>
                        <td className="py-4 px-6 align-middle text-center">
                          {isFilled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ✓ Terisi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              — Kosong
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
