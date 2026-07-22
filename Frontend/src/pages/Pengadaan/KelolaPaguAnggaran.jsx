import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, DollarSign, FileText, Database, History, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatNumber } from '@/utils/formatters';

const KLASIFIKASI_OPTIONS = [
  { label: 'SKKI - B1', skko_skki: 'SKKI', klasifikasi: 'B1' },
  { label: 'SKKI - B2', skko_skki: 'SKKI', klasifikasi: 'B2' },
  { label: 'SKKI - B3', skko_skki: 'SKKI', klasifikasi: 'B3' },
  { label: 'SKKO - A0', skko_skki: 'SKKO', klasifikasi: 'A0' },
];

export default function KelolaPaguAnggaran() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const year = searchParams.get('tahun') || new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({});

  // Form State
  const [selectedKat, setSelectedKat] = useState('SKKI - B1');
  const [jenisTx, setJenisTx] = useState('penambahan'); // 'awal' or 'penambahan'
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPaguData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/pagu-anggaran', { params: { tahun: year } });
      if (res.data?.success) {
        setHistory(res.data.data.history || []);
        setSummary(res.data.data.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaguData();
  }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nominal || isNaN(nominal) || Number(nominal) <= 0) {
      setErrorMsg('Masukkan nominal anggaran yang valid (> 0)');
      return;
    }

    const katObj = KLASIFIKASI_OPTIONS.find(k => k.label === selectedKat);
    if (!katObj) return;

    setSubmitting(true);
    try {
      await api.post('/v1/pagu-anggaran', {
        tahun: Number(year),
        skko_skki: katObj.skko_skki,
        klasifikasi: katObj.klasifikasi,
        jenis_transaksi: jenisTx,
        nominal: Number(nominal),
        keterangan: keterangan || (jenisTx === 'awal' ? 'Pagu Anggaran Awal Tahun' : 'Penambahan / Top-up Anggaran'),
      });

      Swal.fire({
        icon: 'success',
        title: 'Anggaran Berhasil Disimpan',
        timer: 1500,
        showConfirmButton: false,
      });

      setNominal('');
      setKeterangan('');
      fetchPaguData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan anggaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus Catatan Anggaran?',
      text: 'Catatan anggaran ini akan dihapus dari riwayat.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/v1/pagu-anggaran/${id}`);
      fetchPaguData();
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Catatan anggaran berhasil dihapus.', timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus catatan anggaran.' });
    }
  };

  const fmtRp = (val) => val ? `Rp ${formatNumber(val, 0)}` : 'Rp 0';

  const cardHeaderStyle = {
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fafafa'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#64748b',
    marginBottom: '5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    transition: 'border-color 0.15s',
    background: '#ffffff'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, margin: '0 auto', width: '100%', padding: '0 20px' }}>
      
      {/* HEADER NAV */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/pengadaan/kontrak')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1',
            background: '#ffffff', color: '#64748b', fontSize: '0.825rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Kelola Pagu Anggaran</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
            Kelola pagu anggaran tahunan dan penambahan anggaran triwulan
          </p>
        </div>
      </div>

      {/* CARD 1: RINGKASAN PAGU TAHUNAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div style={cardHeaderStyle}>
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
            <Database size={16} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINGKASAN TOTAL PAGU TAHUN {year}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KLASIFIKASI_OPTIONS.map(opt => {
              const key = `${opt.skko_skki}_${opt.klasifikasi}`;
              const val = summary[key] || 0;
              return (
                <div key={key} style={{
                  padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0',
                  background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#334155' }}>
                    {fmtRp(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARD 2: INPUT / TOP-UP ANGGARAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div style={cardHeaderStyle}>
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">INPUT / TOP-UP ANGGARAN BARU</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-semibold">
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            <div className="flex gap-4">
              <div className="w-1/2">
                <label style={labelStyle}>Kategori Anggaran *</label>
                <select
                  value={selectedKat}
                  onChange={e => setSelectedKat(e.target.value)}
                  style={inputStyle}
                >
                  {KLASIFIKASI_OPTIONS.map(opt => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-1/2">
                <label style={labelStyle}>Jenis Transaksi *</label>
                <select
                  value={jenisTx}
                  onChange={e => setJenisTx(e.target.value)}
                  style={inputStyle}
                >
                  <option value="penambahan">Penambahan / Top-Up Anggaran</option>
                  <option value="awal">Pagu Awal Tahun</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nominal Anggaran (Rp) *</label>
              <input
                type="number"
                step="1"
                placeholder="Masukkan jumlah dana..."
                value={nominal}
                onChange={e => setNominal(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Keterangan / No. Dokumen Revisi</label>
              <textarea
                rows={3}
                placeholder="Contoh: Penambahan revisi triwulan II No ND-..."
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: '#14A2BA', color: '#ffffff', fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Simpan Anggaran
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CARD 3: RIWAYAT TRANSAKSI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div style={cardHeaderStyle}>
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <History size={16} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">RIWAYAT TRANSAKSI ANGGARAN TAHUN {year}</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs font-semibold">Memuat riwayat...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              Belum ada riwayat pagu anggaran untuk tahun {year}.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Jenis Transaksi</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-800">
                        {item.skko_skki} - {item.klasifikasi}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          item.jenis_transaksi === 'awal' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.jenis_transaksi === 'awal' ? 'Pagu Awal' : 'Top-Up'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{fmtRp(item.nominal)}</td>
                      <td className="p-3 text-slate-500" title={item.keterangan}>
                        {item.keterangan || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            border: 'none', background: 'transparent', color: '#ef4444',
                            cursor: 'pointer', padding: '6px'
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}
