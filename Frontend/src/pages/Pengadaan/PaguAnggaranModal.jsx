import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Calendar, Tag, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { formatNumber } from '@/utils/formatters';

const KLASIFIKASI_OPTIONS = [
  { label: 'SKKI - B1', skko_skki: 'SKKI', klasifikasi: 'B1' },
  { label: 'SKKI - B2', skko_skki: 'SKKI', klasifikasi: 'B2' },
  { label: 'SKKI - B3', skko_skki: 'SKKI', klasifikasi: 'B3' },
  { label: 'SKKO - A0', skko_skki: 'SKKO', klasifikasi: 'A0' },
];

export default function PaguAnggaranModal({ isOpen, onClose, year, onSuccess }) {
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'history'
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
      const res = await api.get('/v1/pagu-anggaran', { params: { tahun: year || 2026 } });
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
    if (isOpen) {
      fetchPaguData();
    }
  }, [isOpen, year]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanNominal = parseFloat(nominal.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;

    if (!nominal || cleanNominal <= 0) {
      setErrorMsg('Masukkan nominal anggaran yang valid (> 0)');
      return;
    }

    const katObj = KLASIFIKASI_OPTIONS.find(k => k.label === selectedKat);
    if (!katObj) return;

    setSubmitting(true);
    try {
      await api.post('/v1/pagu-anggaran', {
        tahun: year || 2026,
        skko_skki: katObj.skko_skki,
        klasifikasi: katObj.klasifikasi,
        jenis_transaksi: jenisTx,
        nominal: cleanNominal,
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
      if (onSuccess) onSuccess();
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
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Hapus'
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/v1/pagu-anggaran/${id}`);
      fetchPaguData();
      if (onSuccess) onSuccess();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus catatan anggaran.' });
    }
  };

  const fmtRp = (val) => val ? `Rp ${formatNumber(val, 0)}` : 'Rp 0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl">Kelola Pagu Anggaran</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Tahun {year || 2026} — SKKI (B1, B2, B3) & SKKO (A0)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-8 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('input')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
              activeTab === 'input'
                ? 'border-pln-blue-mid text-pln-blue-mid'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Input / Top-Up Anggaran
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
              activeTab === 'history'
                ? 'border-pln-blue-mid text-pln-blue-mid'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Riwayat Anggaran ({history.length})
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {activeTab === 'input' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {errorMsg && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-semibold">
                  <AlertCircle size={18} /> {errorMsg}
                </div>
              )}

              {/* Ringkasan Pagu Saat Ini */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pagu Terdaftar Tahun {year || 2026}</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {KLASIFIKASI_OPTIONS.map(opt => {
                    const key = `${opt.skko_skki}_${opt.klasifikasi}`;
                    const val = summary[key] || 0;
                    return (
                      <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{opt.label}</span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-800">{fmtRp(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Pilih Kategori *</label>
                  <select
                    value={selectedKat}
                    onChange={e => setSelectedKat(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-pln-blue-mid bg-white shadow-sm"
                  >
                    {KLASIFIKASI_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Jenis Transaksi *</label>
                  <select
                    value={jenisTx}
                    onChange={e => setJenisTx(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-pln-blue-mid bg-white shadow-sm"
                  >
                    <option value="penambahan">Penambahan / Top-Up Anggaran</option>
                    <option value="awal">Pagu Awal Tahun</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Nominal Anggaran (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 500.000.000"
                  value={nominal}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9.,]/g, '');
                    let cleanVal = val.replace(/\./g, '');
                    let parts = cleanVal.split(',');
                    if (parts[0]) {
                      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    }
                    setNominal(parts.join(','));
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-pln-blue-mid bg-white shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Keterangan / No. Dokumen Revisi</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Penambahan anggaran revisi triwulan II No ND..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-pln-blue-mid bg-white shadow-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-pln-blue-mid hover:opacity-90 flex items-center gap-2 shadow-md transition-all"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Tambah Anggaran
                </button>
              </div>

            </form>
          ) : (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-semibold">Memuat riwayat...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                  Belum ada riwayat pagu anggaran untuk tahun {year || 2026}.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Jenis</th>
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
                          <td className="p-3 text-slate-500 max-w-[180px] truncate" title={item.keterangan}>
                            {item.keterangan || '—'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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
          )}
        </div>

      </div>
    </div>
  );
}
