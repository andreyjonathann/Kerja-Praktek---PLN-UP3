import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Save, CheckCircle, ArrowLeft, Plus, Trash2, FileText, Upload, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

import { useFilter } from '@/context/FilterContext';

export default function InputKinerjaPenghapusanPage() {
  const navigate = useNavigate();
  const { filters } = useFilter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [bulan, setBulan] = useState((filters.month || '').toString());
  const [tahun, setTahun] = useState((filters.year || new Date().getFullYear()).toString());

  const [rows, setRows] = useState([
    { id: 1, tahap: 'Tahap 1', no_surat: '', jumlah_pelanggan: '', nominal: '', file_surat: null }
  ]);

  const [existingDetails, setExistingDetails] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (tahun) {
      const fetchExisting = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/v1/niaga/penghapusan?tahun=${tahun}`);
          setExistingDetails(res.data.details || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchExisting();
    }
  }, [tahun]);

  const isDuplicate = !!(bulan && existingDetails.some(d => parseInt(d.bulan) === parseInt(bulan)));

  useEffect(() => {
    if (bulan && existingDetails.length > 0) {
      const matches = existingDetails.filter(d => parseInt(d.bulan) === parseInt(bulan));
      if (matches.length > 0) {
        setRows(matches.map((m, idx) => ({
          id: m.id || idx,
          tahap: m.tahap || '',
          no_surat: m.no_surat || '',
          jumlah_pelanggan: m.jumlah_pelanggan != null ? m.jumlah_pelanggan.toString() : '',
          nominal: m.nominal != null ? m.nominal.toString() : '',
          file_surat: null,
          file_surat_url: m.file_surat_url || null
        })));
      } else {
        setRows([{ id: 1, tahap: 'Tahap 1', no_surat: '', jumlah_pelanggan: '', nominal: '', file_surat: null }]);
      }
    } else {
      setRows([{ id: 1, tahap: 'Tahap 1', no_surat: '', jumlah_pelanggan: '', nominal: '', file_surat: null }]);
    }
  }, [bulan, existingDetails]);

  const isFormLocked = !bulan || !tahun;

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      { id: Date.now(), tahap: `Tahap ${prev.length + 1}`, no_surat: '', jumlah_pelanggan: '', nominal: '', file_surat: null }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleFileChange = (id, file) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, file_surat: file };
      }
      return r;
    }));
  };

  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    let str = val.toString().replace(/\./g, '').replace(/,/g, '');
    let clean = str.replace(/[^0-9]/g, '');
    if (clean === '') return '';
    return parseInt(clean, 10).toLocaleString('id-ID');
  };

  const parseCleanNumber = (val) => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;
  };

  const totalNominalBulan = rows.reduce((acc, curr) => acc + parseCleanNumber(curr.nominal), 0);
  const totalPelangganBulan = rows.reduce((acc, curr) => acc + (parseInt(curr.jumlah_pelanggan) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bulan || !tahun) {
      alert('Silakan pilih Bulan dan Tahun terlebih dahulu.');
      return;
    }
    if (isDuplicate) {
      alert('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('tahun', tahun);
      formData.append('bulan', bulan);

      rows.forEach((r, idx) => {
        formData.append(`entries[${idx}][tahap]`, r.tahap || '');
        formData.append(`entries[${idx}][no_surat]`, r.no_surat || '');
        formData.append(`entries[${idx}][jumlah_pelanggan]`, parseInt(r.jumlah_pelanggan) || 0);
        formData.append(`entries[${idx}][nominal]`, parseCleanNumber(r.nominal));
        if (r.file_surat) {
          formData.append(`entries[${idx}][file_surat]`, r.file_surat);
        }
      });

      await api.post('/v1/niaga/penghapusan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      window.dispatchEvent(new Event('sigap:refresh'));
      setSuccess(true);
      setTimeout(() => {
        navigate('/niaga/penghapusan');
      }, 1000);
    } catch (err) {
      console.error('Gagal menyimpan Penghapusan PRR:', err);
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (dis) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #cbd5e1', background: dis ? '#f1f5f9' : '#f8fafc',
    fontSize: '0.85rem', color: dis ? '#94a3b8' : '#1e293b', outline: 'none',
  });

  const pillInputStyle = (dis) => ({
    width: '100%', padding: '10px 18px', borderRadius: 9999,
    border: '1px solid #cbd5e1', background: dis ? '#f1f5f9' : '#ffffff',
    fontSize: '0.88rem', fontWeight: 650, color: dis ? '#94a3b8' : '#1e293b',
    textAlign: 'right', outline: 'none',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)',
    cursor: dis ? 'not-allowed' : 'text',
  });

  try {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-10 pb-28">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 780, margin: '0 auto', width: '100%', padding: '0 20px' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/niaga/penghapusan')}
              style={{
                background: 'white', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                Tambah Usulan Penghapusan PRR
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                Formulir pengusulan tahap penghapusan piutang ragu-ragu and upload surat usulan
              </p>
            </div>
          </div>

          {/* WARNING ALERT FOR MONTH & YEAR SELECTION */}
          {isFormLocked && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderRadius: 10, background: '#fffbe3', border: '1px solid #fde68a',
              color: '#b45309', fontWeight: 650, fontSize: '0.86rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>PENTING: Silakan pilih <strong>Bulan</strong> dan <strong>Tahun</strong> terlebih dahulu untuk mengaktifkan formulir input usulan.</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
              borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0',
              color: '#16a34a', fontWeight: 600, fontSize: '0.86rem'
            }}>
              <CheckCircle size={16} /> Data Usulan Penghapusan PRR Berhasil Disimpan!
            </div>
          )}

          {/* DUPLICATE WARNING */}
          {isDuplicate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
              borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontWeight: 600, fontSize: '0.86rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.</span>
            </div>
          )}

          <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>

            {/* PERIODE SELECTION */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">PERIODE USULAN</h3>
              </div>
              <div className="p-5 flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                  <select
                    value={bulan}
                    onChange={e => setBulan(e.target.value)}
                    required
                    style={inputStyle(false)}
                  >
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input
                    type="number"
                    value={tahun}
                    onChange={e => setTahun(e.target.value)}
                    required
                    placeholder="Tahun"
                    style={inputStyle(false)}
                  />
                </div>
              </div>
            </div>

            {/* REPEATABLE ROWS FOR TAHAP USULAN */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">DAFTAR TAHAP USULAN</h3>
                </div>
                {!isDuplicate && (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    style={{
                      background: 'rgba(139,92,246,0.1)', color: '#7c3aed',
                      border: '1px solid rgba(139,92,246,0.25)',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Plus size={14} /> Tambah Tahap
                  </button>
                )}
              </div>

              <div className="p-5 flex flex-col gap-4">
                {rows.map((row, idx) => (
                  <div
                    key={row.id}
                    style={{
                      padding: 16, borderRadius: 12, border: '1px solid #e2e8f0',
                      background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Usulan #{idx + 1}
                      </span>
                      {rows.length > 1 && !isDuplicate && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          title="Hapus Baris Ini"
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          Tahap Usulan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          disabled={isFormLocked || isDuplicate}
                          value={row.tahap}
                          onChange={e => handleRowChange(row.id, 'tahap', e.target.value)}
                          placeholder="Contoh: Tahap I"
                          style={inputStyle(isFormLocked || isDuplicate)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          No. Surat Usulan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          disabled={isFormLocked || isDuplicate}
                          value={row.no_surat}
                          onChange={e => handleRowChange(row.id, 'no_surat', e.target.value)}
                          placeholder="Contoh: 0123/PRR/2026"
                          style={inputStyle(isFormLocked || isDuplicate)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          Jumlah Pelanggan
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={isFormLocked || isDuplicate}
                          value={row.jumlah_pelanggan}
                          onChange={e => handleRowChange(row.id, 'jumlah_pelanggan', e.target.value)}
                          placeholder="Jumlah Pelanggan (Integer)"
                          required
                          style={inputStyle(isFormLocked || isDuplicate)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                          Nominal (Rupiah)
                        </label>
                        <input
                          type="text"
                          disabled={isFormLocked || isDuplicate}
                          value={formatInputSeparator(row.nominal)}
                          onChange={e => handleRowChange(row.id, 'nominal', e.target.value)}
                          placeholder="0"
                          required
                          className={`w-full border border-slate-300 rounded-full px-4 py-2 text-[13px] shadow-sm text-right outline-none font-semibold ${(isFormLocked || isDuplicate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'}`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                          Upload Berkas Surat Usulan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(PDF / Image / Doc, Max 10MB)</span>
                        </label>
                        <label style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 8, padding: '20px 16px', borderRadius: 12,
                          border: (row.file_surat || row.file_surat_url) ? '2px dashed #8b5cf6' : '2px dashed #cbd5e1',
                          background: (row.file_surat || row.file_surat_url) ? 'rgba(139,92,246,0.04)' : '#ffffff',
                          cursor: (isFormLocked || isDuplicate) ? 'not-allowed' : 'pointer',
                          pointerEvents: (isFormLocked || isDuplicate) ? 'none' : 'auto',
                          transition: 'all 0.2s ease',
                        }}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            disabled={isFormLocked || isDuplicate}
                            onChange={e => handleFileChange(row.id, e.target.files[0] || null)}
                            style={{ display: 'none' }}
                          />
                          {row.file_surat || row.file_surat_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)',
                                  color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                  <FileText size={22} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                    {row.file_surat ? row.file_surat.name : 'Surat Usulan Terunggah'}
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                                    {row.file_surat ? `✓ Berkas Siap Diunggah (${(row.file_surat.size / 1024 / 1024).toFixed(2)} MB)` : '✓ Berkas Terunggah'}
                                  </p>
                                </div>
                              </div>
                              {row.file_surat && !isDuplicate && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleFileChange(row.id, null);
                                  }}
                                  title="Hapus / Batal Upload Berkas Ini"
                                  style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#ef4444', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  <X size={14} /> Hapus File
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <div style={{
                                width: 48, height: 48, borderRadius: 12, background: '#f1f5f9',
                                color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                              }}>
                                <Upload size={24} style={{ color: '#8b5cf6' }} />
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                  Klik atau Pilih Berkas Surat Usulan
                                </p>
                                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                                  Format didukung: PDF, JPG, PNG, DOC (Max 10MB)
                                </p>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {/* SUMMARY HIGHLIGHT */}
                <div style={{
                  padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginTop: 4
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                    Total Bulanan ({rows.length} Usulan):
                  </span>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.88rem', fontWeight: 800 }}>
                    <span style={{ color: '#475569' }}>{formatNumber(totalPelangganBulan)} Pelanggan</span>
                    <span style={{ color: '#7c3aed' }}>Rp {formatNumber(totalNominalBulan)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || isFormLocked || isDuplicate}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: (loading || isFormLocked || isDuplicate) ? '#cbd5e1' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: (loading || isFormLocked || isDuplicate) ? '#94a3b8' : 'white',
                fontSize: '0.92rem', fontWeight: 700, cursor: (loading || isFormLocked || isDuplicate) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (loading || isFormLocked || isDuplicate) ? 'none' : '0 4px 14px rgba(124,58,237,0.25)'
              }}
            >
              <Save size={18} />
              {loading ? 'Menyimpan & Upload Dokumen...' : isDuplicate ? 'Data Sudah Ada' : 'Simpan Semua Usulan Tahap'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="p-8 text-red-600 bg-red-50 border border-red-200 rounded-xl" style={{ margin: 24 }}>
        <h3 className="font-bold text-lg">Error Rendering Halaman Input Kinerja Penghapusan:</h3>
        <p className="text-sm mt-1 text-red-500">Silakan laporkan error berikut kepada admin:</p>
        <pre className="text-xs mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">{err.stack || err.message || String(err)}</pre>
      </div>
    );
  }
}
