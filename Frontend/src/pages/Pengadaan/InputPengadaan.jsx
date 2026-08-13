import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle,
  Briefcase, FileText, Calendar, DollarSign, Hash, Building2
} from 'lucide-react';
import Swal from 'sweetalert2';

const DIREKSI_OPTIONS = ['JARINGAN', 'KONSTRUKSI', 'TE LISTRIK', 'PEMASARAN'];
const SKKO_OPTIONS = ['SKKO', 'SKKI'];
const JENIS_OPTIONS = ['KR', 'SPBL', 'PL'];
const SKKI_KLASIFIKASI = ['B1', 'B2', 'B3'];
const SKKO_KLASIFIKASI = ['A0'];

export default function InputPengadaanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    let str = val.toString().replace('.', ',');
    let parts = str.split(',');
    parts[0] = parts[0].replace(/\./g, '');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return parts.join(',');
  };

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
    defaultValues: {
      direksi_pekerjaan: '',
      uraian_pekerjaan: '',
      no_pr: '',
      pt_pelaksana: '',
      no_kontrak: '',
      tgl_awal: '',
      tgl_akhir: '',
      rp_kontrak: '',
      rab: '',
      no_nd_bidang: '',
      skko_skki: 'SKKI',
      jenis_kontrak: 'KR',
      klasifikasi: 'B1',
    }
  });

  const selectedJenis = watch('jenis_kontrak');
  const selectedSk = watch('skko_skki');
  const selectedKlas = watch('klasifikasi');

  const handleSkChange = (sk) => {
    setValue('skko_skki', sk);
    if (sk === 'SKKO') {
      setValue('klasifikasi', 'A0');
    } else {
      if (!SKKI_KLASIFIKASI.includes(selectedKlas)) {
        setValue('klasifikasi', 'B1');
      }
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFile2, setSelectedFile2] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [existingFile2Url, setExistingFile2Url] = useState('');

  // Load existing data if editing
  useEffect(() => {
    if (!isEditMode) return;
    const fetchExisting = async () => {
      setLoadingData(true);
      setErrorMsg('');
      try {
        const res = await api.get(`/v1/pengadaan/${id}`);
        const d = res.data?.data;
        if (d) {
          reset({
            direksi_pekerjaan: d.direksi_pekerjaan || '',
            uraian_pekerjaan: d.uraian_pekerjaan || '',
            no_pr: d.no_pr || '',
            pt_pelaksana: d.pt_pelaksana || '',
            no_kontrak: d.no_kontrak || '',
            tgl_awal: d.tgl_awal || '',
            tgl_akhir: d.tgl_akhir || '',
            rp_kontrak: d.rp_kontrak != null ? formatInputSeparator(d.rp_kontrak) : '',
            rab: d.rab != null ? formatInputSeparator(d.rab) : '',
            no_nd_bidang: d.no_nd_bidang || '',
            skko_skki: d.skko_skki || 'SKKO',
            jenis_kontrak: d.jenis_kontrak || 'KR',
            klasifikasi: d.klasifikasi || 'B1',
          });
          if (d.file_kontrak_url) {
            setExistingFileUrl(d.file_kontrak_url);
          }
          if (d.file_kontrak_2_url) {
            setExistingFile2Url(d.file_kontrak_2_url);
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal memuat data kontrak existing.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchExisting();
  }, [id, isEditMode, reset]);

  const handleDeleteFile = async (fileIndex) => {
    const confirm = await Swal.fire({
      title: 'Hapus File Dokumen?',
      text: "Berkas fisik di server akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/v1/pengadaan/${id}/file/${fileIndex}`);
      Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'File dokumen berhasil dihapus.', timer: 1000, showConfirmButton: false });
      if (fileIndex === 1) {
        setExistingFileUrl('');
      } else {
        setExistingFile2Url('');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menghapus file.' });
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const formData = new FormData();
      
      const cleanMoney = (val) => {
        if (val == null || val === '') return '';
        return val.toString().replace(/\./g, '').replace(/,/g, '.');
      };
      
      const cleanData = { ...data };
      if (cleanData.rab) cleanData.rab = cleanMoney(cleanData.rab);
      if (cleanData.rp_kontrak) cleanData.rp_kontrak = cleanMoney(cleanData.rp_kontrak);

      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] !== null && cleanData[key] !== undefined && cleanData[key] !== '') {
          formData.append(key, cleanData[key]);
        }
      });

      if (selectedFile) {
        formData.append('file_kontrak', selectedFile);
      }
      if (selectedFile2) {
        formData.append('file_kontrak_2', selectedFile2);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (isEditMode) {
        formData.append('_method', 'PUT');
        await api.post(`/v1/pengadaan/${id}`, formData, config);
      } else {
        await api.post('/v1/pengadaan', formData, config);
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Data Berhasil Diupdate' : 'Data Berhasil Disimpan',
        text: 'Anda akan dialihkan kembali ke Dashboard Kontrak.',
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate('/pengadaan/kontrak');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: 'Hapus Data Kontrak?',
      text: "Tindakan ini tidak dapat dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setDeleting(true);
    setErrorMsg('');
    try {
      await api.delete(`/v1/pengadaan/${id}`);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Data Kontrak berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false
      });
      setTimeout(() => navigate('/pengadaan/kontrak'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus data.');
    } finally {
      setDeleting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} className="animate-spin text-pln-blue-mid" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Memuat data kontrak...</span>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border-strong)', background: 'var(--bg-input)',
    fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              {isEditMode ? 'Edit Data Kontrak' : 'Tambah Data Kontrak'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {isEditMode ? `Memperbarui paket pengadaan ID #${id}` : 'Tambahkan paket pekerjaan pengadaan baru'}
            </p>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Kontrak berhasil disimpan!
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={handleSubmit(onSubmit)}>



          {/* CARD IDENTITAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><Briefcase size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">IDENTITAS PEKERJAAN</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Uraian Pekerjaan *</label>
                <textarea
                  {...register('uraian_pekerjaan', { required: 'Uraian pekerjaan wajib diisi' })}
                  rows={3}
                  placeholder="Masukkan deskripsi lengkap paket pekerjaan..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                {errors.uraian_pekerjaan && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors.uraian_pekerjaan.message}</p>}
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Direksi Pekerjaan *</label>
                  <select {...register('direksi_pekerjaan', { required: 'Direksi wajib dipilih' })} style={inputStyle}>
                    <option value="">Pilih Direksi</option>
                    {DIREKSI_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.direksi_pekerjaan && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 3 }}>{errors.direksi_pekerjaan.message}</p>}
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>No PR</label>
                  <input type="text" {...register('no_pr')} placeholder="300228XXXX" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>No ND Bidang</label>
                <input type="text" {...register('no_nd_bidang')} placeholder="Masukkan nomor ND Bidang..." style={inputStyle} />
              </div>
            </div>
          </div>

          {/* CARD KLASIFIKASI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Hash size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">KLASIFIKASI KONTRAK</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Jenis Kontrak</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {JENIS_OPTIONS.map(j => (
                      <button key={j} type="button" onClick={() => setValue('jenis_kontrak', j)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                          border: selectedJenis === j ? '1.5px solid #14A2BA' : '1.5px solid #e2e8f0',
                          background: selectedJenis === j ? 'rgba(20,162,186,0.08)' : '#f8fafc',
                          color: selectedJenis === j ? '#14A2BA' : '#64748b'
                        }}
                      >{j}</button>
                    ))}
                  </div>
                </div>

                <div className="w-1/3">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>SKKO / SKKI</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {SKKO_OPTIONS.map(s => (
                      <button key={s} type="button" onClick={() => handleSkChange(s)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                          border: selectedSk === s ? '1.5px solid #0284C7' : '1.5px solid #e2e8f0',
                          background: selectedSk === s ? 'rgba(2,132,199,0.08)' : '#f8fafc',
                          color: selectedSk === s ? '#0284C7' : '#64748b'
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                <div className="w-1/3">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Klasifikasi</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(selectedSk === 'SKKO' ? SKKO_KLASIFIKASI : SKKI_KLASIFIKASI).map(k => (
                      <button key={k} type="button" onClick={() => setValue('klasifikasi', k)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                          border: selectedKlas === k ? '1.5px solid #0D9488' : '1.5px solid #e2e8f0',
                          background: selectedKlas === k ? 'rgba(13,148,136,0.08)' : '#f8fafc',
                          color: selectedKlas === k ? '#0D9488' : '#64748b'
                        }}
                      >{k}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD PELAKSANA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><Building2 size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PELAKSANA & KONTRAK</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Nama PT Pelaksana</label>
                  <input type="text" {...register('pt_pelaksana')} placeholder="PT Pelaksana Mandiri..." style={inputStyle} />
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Nomor Kontrak</label>
                  <input type="text" {...register('no_kontrak')} placeholder="Masukkan nomor kontrak atau -" style={inputStyle} />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tanggal Awal</label>
                  <input type="date" {...register('tgl_awal')} style={inputStyle} />
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tanggal Akhir</label>
                  <input type="date" {...register('tgl_akhir')} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* FILE 1 */}
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>
                    Dokumen Kontrak (PDF - Maks 10MB)
                  </label>
                  
                  {/* Native input hidden */}
                  <input
                    id="file-input-1"
                    type="file"
                    accept=".pdf"
                    onChange={e => setSelectedFile(e.target.files[0] || null)}
                    style={{ display: 'none' }}
                  />

                  {/* Custom upload area or preview card */}
                  {selectedFile || existingFileUrl ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
                      background: '#f8fafc', position: 'relative'
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, background: '#fee2e2',
                        color: '#ef4444', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem'
                      }}>
                        PDF
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#334155',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {selectedFile ? selectedFile.name : 'Dokumen Kontrak Utama'}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                          {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Tersimpan di server'}
                        </span>
                        {!selectedFile && existingFileUrl && (
                          <div style={{ marginTop: 2 }}>
                            <a href={existingFileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#0284C7', textDecoration: 'underline', fontWeight: 700 }}>
                              Lihat Dokumen
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedFile) {
                            setSelectedFile(null);
                            document.getElementById('file-input-1').value = '';
                          } else {
                            handleDeleteFile(1);
                          }
                        }}
                        style={{
                          width: 24, height: 24, borderRadius: 12, background: '#ef4444',
                          color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800,
                          lineHeight: 0, padding: 0
                        }}
                        title="Hapus file"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('file-input-1').click()}
                      style={{
                        border: '2px dashed #cbd5e1', borderRadius: 12, padding: '16px 20px',
                        textAlign: 'center', cursor: 'pointer', background: '#fafbfc',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#14A2BA'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    >
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
                        📁 Pilih Berkas Kontrak
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>
                        Klik untuk mengunggah PDF (Maks 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD ANGGARAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><DollarSign size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">ANGGARAN & NILAI KONTRAK</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>RAB (Rencana Anggaran Biaya)</label>
                  <input
                    type="text"
                    placeholder="Rp"
                    style={inputStyle}
                    {...register('rab', {
                      onChange: (e) => {
                        let val = e.target.value.replace(/[^0-9.,]/g, '');
                        let cleanVal = val.replace(/\./g, '');
                        let parts = cleanVal.split(',');
                        if (parts[0]) {
                          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        }
                        setValue('rab', parts.join(','));
                      }
                    })}
                  />
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Rp Kontrak (Nilai Realisasi)</label>
                  <input
                    type="text"
                    placeholder="Rp"
                    style={inputStyle}
                    {...register('rp_kontrak', {
                      onChange: (e) => {
                        let val = e.target.value.replace(/[^0-9.,]/g, '');
                        let cleanVal = val.replace(/\./g, '');
                        let parts = cleanVal.split(',');
                        if (parts[0]) {
                          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        }
                        setValue('rp_kontrak', parts.join(','));
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BUTTON ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                    border: '1.5px solid #EF4444', background: 'transparent', color: '#EF4444',
                    transition: 'all 0.15s'
                  }}
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Hapus Data Kontrak
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ height: 42, fontSize: '0.9rem', borderRadius: 10 }}>
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 42, fontSize: '0.9rem', fontWeight: 700, minWidth: 150, borderRadius: 10,
                }}
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save size={16} /> Simpan Data</>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
