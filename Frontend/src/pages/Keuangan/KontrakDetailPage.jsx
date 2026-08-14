import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit2, FileText, CheckCircle, Clock, AlertCircle, Upload, Plus, File, Trash } from 'lucide-react'
import { getContractDetail, storePayment, updatePayment, deletePayment, uploadDocument, deleteDocument } from '@/services/keuanganService'
import { formatNumber } from '@/utils/formatters'

const STATUS_COLORS = {
  lunas:    { bg: 'bg-emerald-50 border-emerald-100', color: 'text-emerald-600' },
  rencana:  { bg: 'bg-sky-50 border-sky-100',  color: 'text-sky-600' },
  sebagian: { bg: 'bg-amber-50 border-amber-100',  color: 'text-amber-600' },
  tertunda: { bg: 'bg-rose-50 border-rose-100',   color: 'text-rose-600' },
}

const STATUS_ICON = { 
  lunas: <CheckCircle size={13}/>, 
  rencana: <Clock size={13}/>, 
  sebagian: <AlertCircle size={13}/>, 
  tertunda: <AlertCircle size={13}/> 
}

const BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const EMPTY_PAY_FORM = { jenis:'termin', termin_ke:1, nilai_realisasi:'', tanggal_bayar:'', bulan_rencana_bayar:'', keterangan_kendala:'', status:'rencana' }
const EMPTY_DOC_FORM = { jenis:'bastp', urutan_ke:1, nomor_dokumen:'', tanggal_dokumen:'' }

export default function KontrakDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Payment Form States
  const [payForm, setPayForm] = useState(EMPTY_PAY_FORM)
  const [editPayId, setEditPayId] = useState(null)
  const [savingPay, setSavingPay] = useState(false)
  
  // Document Form States
  const [docForm, setDocForm] = useState(EMPTY_DOC_FORM)
  const [docFile, setDocFile] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getContractDetail(id)
      setDetail(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  // Payment Handlers
  const handleEditPay = (payment) => {
    setEditPayId(payment.id)
    setPayForm({
      jenis: payment.jenis,
      termin_ke: payment.termin_ke,
      nilai_realisasi: payment.nilai_realisasi.toString(),
      tanggal_bayar: payment.tanggal_bayar || '',
      bulan_rencana_bayar: payment.bulan_rencana_bayar || '',
      keterangan_kendala: payment.keterangan_kendala || '',
      status: payment.status,
    })
  }

  const handleCancelPay = () => {
    setEditPayId(null)
    setPayForm(EMPTY_PAY_FORM)
  }

  const handleSavePay = async () => {
    const cleanRealisasi = parseFloat(payForm.nilai_realisasi.toString().replace(/[.,]/g, ''))
    if (isNaN(cleanRealisasi) || cleanRealisasi <= 0) { 
      showToast('Nilai realisasi wajib diisi dengan benar (> 0)', 'error')
      return 
    }
    setSavingPay(true)
    try {
      const payload = { ...payForm, nilai_realisasi: cleanRealisasi }
      if (editPayId) {
        await updatePayment(editPayId, payload)
        showToast('Pembayaran berhasil diperbarui')
      } else {
        await storePayment({ ...payload, pengadaan_id: id })
        showToast('Pembayaran berhasil ditambahkan')
      }
      setEditPayId(null)
      setPayForm(EMPTY_PAY_FORM)
      await fetchDetail()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan pembayaran', 'error')
    } finally {
      setSavingPay(false)
    }
  }

  const handleDeletePay = async (payId) => {
    if (!window.confirm('Yakin ingin menghapus data pembayaran ini?')) return
    try {
      await deletePayment(payId)
      showToast('Pembayaran berhasil dihapus')
      await fetchDetail()
    } catch (e) {
      showToast('Gagal menghapus pembayaran', 'error')
    }
  }

  // Document Handlers
  const handleSaveDoc = async () => {
    if (!docForm.nomor_dokumen || !docForm.tanggal_dokumen) {
      showToast('Nomor dan tanggal dokumen wajib diisi', 'error')
      return
    }
    if (!docFile) {
      showToast('Harap pilih berkas PDF/Gambar terlebih dahulu', 'error')
      return
    }
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('pengadaan_id', id)
      formData.append('jenis', docForm.jenis)
      formData.append('urutan_ke', docForm.urutan_ke)
      formData.append('nomor_dokumen', docForm.nomor_dokumen)
      formData.append('tanggal_dokumen', docForm.tanggal_dokumen)
      formData.append('file', docFile)

      await uploadDocument(formData)
      showToast('Dokumen berhasil diunggah')
      setDocForm(EMPTY_DOC_FORM)
      setDocFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDetail()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal mengunggah dokumen', 'error')
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Yakin ingin menghapus dokumen ini?')) return
    try {
      await deleteDocument(docId)
      showToast('Dokumen berhasil dihapus')
      await fetchDetail()
    } catch (e) {
      showToast('Gagal menghapus dokumen', 'error')
    }
  }

  const p = detail?.pengadaan
  const summary = detail?.summary || {}
  const payments = detail?.realisasi_pembayarans || []
  const documents = detail?.dokumen_pendukungs || []

  const handleBack = () => {
    const tabParam = p?.skko_skki ? `?tab=${p.skko_skki.toLowerCase()}` : ''
    navigate(`/keuangan${tabParam}`)
  }

  const cardStyle = "p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-6"
  const sectionTitleStyle = "text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-1 flex items-center gap-2"
  const labelStyle = "block text-sm font-semibold text-slate-600 mb-2"
  const inputStyle = "w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-pln-blue-mid"

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack} 
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16}/> Kembali
        </button>
        <div>
          <div className="text-[10px] tracking-wider uppercase font-bold text-slate-400 mb-0.5">
            Detail Kontrak — {p?.skko_skki || 'SKKI/SKKO'}
          </div>
          <h1 className="text-slate-800 font-extrabold text-lg leading-snug max-w-[720px] m-0">
            {loading ? 'Memuat data pekerjaan...' : (p?.uraian_pekerjaan || '—')}
          </h1>
          {p?.no_kontrak && (
            <p className="text-xs font-semibold text-slate-400 mt-1.5 m-0">
              No. Kontrak: {p.no_kontrak} <span className="text-slate-300 mx-2">|</span> {p.pt_pelaksana || 'Penyedia'}
            </p>
          )}
        </div>
      </div>

      {/* ── Toast Message ── */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-600' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Summary Metrics Row ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Nilai Kontrak', value:`Rp ${formatNumber(summary.nilai_kontrak)}`, color:'text-slate-700', bg:'bg-white' },
            { label:'Total Terbayar', value:`Rp ${formatNumber(summary.total_terbayar)}`, color:'text-emerald-600', bg:'bg-white' },
            { label:'Sisa Kontrak', value:`Rp ${formatNumber(summary.sisa_kontrak)}`, color: summary.sisa_kontrak <= 0 ? 'text-emerald-600' : 'text-amber-600', bg:'bg-white' },
          ].map((s, i) => (
            <div key={i} className={`p-5 rounded-xl border border-slate-200 ${s.bg} flex flex-col justify-center shadow-sm`}>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-base font-extrabold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CARD 1: Identitas & Pelaksana Kontrak ── */}
      <div className={cardStyle}>
        <h3 className={sectionTitleStyle}>
          <span className="w-2.5 h-2.5 rounded-full bg-pln-blue-mid"></span>
          IDENTITAS & PELAKSANA KONTRAK
        </h3>
        
        {loading ? (
          <div className="text-xs text-slate-400 py-4">Memuat data identitas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {[
              { label: 'Uraian Pekerjaan', value: p?.uraian_pekerjaan || '-' },
              { label: 'Nama PT Pelaksana', value: p?.pt_pelaksana || '-' },
              { label: 'Nomor Kontrak', value: p?.no_kontrak || '-' },
              { label: 'Direksi Pekerjaan', value: p?.direksi_pekerjaan || '-' },
              { label: 'Klasifikasi Kontrak', value: `${p?.skko_skki || ''} - ${p?.klasifikasi || ''}` },
              { label: 'Tanggal Awal Kontrak', value: p?.tgl_awal ? new Date(p.tgl_awal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Tanggal Akhir Kontrak', value: p?.tgl_akhir ? new Date(p.tgl_akhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Status Kontrak', value: p?.status || '-' },
            ].map((f, i) => (
              <div key={i} className="border-b border-slate-100 pb-2">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{f.label}</span>
                <span className="text-sm font-semibold text-slate-700">{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 2: Rencana & Realisasi Pembayaran ── */}
      <div className={cardStyle}>
        <h3 className={sectionTitleStyle}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          RENCANA & REALISASI PEMBAYARAN
        </h3>

        {/* Form input pembayaran */}
        <div className="p-5 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-1">
            {editPayId ? '📝 Edit Pembayaran' : '➕ Tambah Realisasi Pembayaran'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label className={labelStyle}>Jenis</label>
              <select value={payForm.jenis} onChange={e => setPayForm(p => ({...p, jenis:e.target.value}))} className={inputStyle}>
                <option value="termin">Termin</option>
                <option value="bastp_bertahap">BASTP Bertahap</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Termin ke-</label>
              <input type="number" min="1" value={payForm.termin_ke} onChange={e => setPayForm(p => ({...p, termin_ke:e.target.value}))} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Nilai Realisasi (Rp)</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={payForm.nilai_realisasi ? Number(payForm.nilai_realisasi.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''} 
                onChange={e => setPayForm(p => ({...p, nilai_realisasi: e.target.value.replace(/[^0-9]/g, '')}))}
                placeholder="0"
                className={inputStyle + " font-bold text-slate-800"}
              />
            </div>
            <div>
              <label className={labelStyle}>Tanggal Bayar</label>
              <input type="date" value={payForm.tanggal_bayar} onChange={e => setPayForm(p => ({...p, tanggal_bayar:e.target.value}))} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Bulan Rencana Bayar</label>
              <select value={payForm.bulan_rencana_bayar} onChange={e => setPayForm(p => ({...p, bulan_rencana_bayar:e.target.value}))} className={inputStyle}>
                <option value="">— Pilih Bulan —</option>
                {BULAN_LIST.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Status</label>
              <select value={payForm.status} onChange={e => setPayForm(p => ({...p, status:e.target.value}))} className={inputStyle}>
                <option value="rencana">Rencana</option>
                <option value="lunas">Lunas</option>
                <option value="sebagian">Sebagian</option>
                <option value="tertunda">Tertunda</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Keterangan Kendala / Catatan</label>
            <textarea 
              value={payForm.keterangan_kendala} 
              onChange={e => setPayForm(p => ({...p, keterangan_kendala:e.target.value}))} 
              rows={2}
              placeholder="Masukkan catatan jika ada kendala..."
              className={inputStyle + " resize-none"}
            />
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-200 pt-4">
            {editPayId && (
              <button onClick={handleCancelPay} className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
            )}
            <button 
              onClick={handleSavePay} 
              disabled={savingPay || !payForm.nilai_realisasi}
              className="px-8 py-2.5 rounded-xl text-xs font-extrabold text-white bg-pln-blue-mid hover:bg-pln-blue cursor-pointer transition-all shadow-sm active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {savingPay ? 'Menyimpan...' : (editPayId ? 'Simpan Perubahan' : 'Tambah Realisasi')}
            </button>
          </div>
        </div>

        {/* History List Pembayaran */}
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Realisasi & Rencana</h4>
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-4">Memuat data...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 flex flex-col items-center justify-center">
              <Clock size={32} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-400 m-0">Belum ada rencana / realisasi pembayaran yang dicatat.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map(pay => {
                const sc = STATUS_COLORS[pay.status] || STATUS_COLORS.rencana
                return (
                  <div key={pay.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-150 bg-white shadow-sm hover:shadow transition-shadow">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-800">
                          Termin {pay.termin_ke} — {pay.jenis === 'termin' ? 'Termin' : 'BASTP Bertahap'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${sc.bg} ${sc.color}`}>
                          {STATUS_ICON[pay.status]} {pay.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3.5 text-xs text-slate-400 flex-wrap">
                        <span className="font-bold text-slate-700">Rp {formatNumber(pay.nilai_realisasi)}</span>
                        {pay.tanggal_bayar && <span>Tgl: {pay.tanggal_bayar}</span>}
                        {pay.bulan_rencana_bayar && <span>Rencana: {pay.bulan_rencana_bayar}</span>}
                        {pay.user?.name && <span>oleh: {pay.user.name}</span>}
                      </div>
                      {pay.keterangan_kendala && (
                        <p className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg max-w-fit m-0">
                          ⚠ Kendala: {pay.keterangan_kendala}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditPay(pay)} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-colors cursor-pointer">
                        <Edit2 size={14}/>
                      </button>
                      <button onClick={() => handleDeletePay(pay.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 3: Dokumen Pendukung (BASTP / AMD) ── */}
      <div className={cardStyle}>
        <h3 className={sectionTitleStyle}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          DOKUMEN PENDUKUNG (BASTP / AMD)
        </h3>

        {/* Form Upload Dokumen */}
        <div className="p-5 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-1">
            ➕ Unggah Dokumen Pendukung Baru
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelStyle}>Jenis Dokumen</label>
              <select value={docForm.jenis} onChange={e => setDocForm(p => ({...p, jenis:e.target.value}))} className={inputStyle}>
                <option value="bastp">BASTP</option>
                <option value="amd">AMD</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Urutan ke-</label>
              <input type="number" min="1" value={docForm.urutan_ke} onChange={e => setDocForm(p => ({...p, urutan_ke:Number(e.target.value)}))} className={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>Nomor Dokumen</label>
              <input type="text" placeholder="Masukkan nomor dokumen..." value={docForm.nomor_dokumen} onChange={e => setDocForm(p => ({...p, nomor_dokumen:e.target.value}))} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Tanggal Dokumen</label>
              <input type="date" value={docForm.tanggal_dokumen} onChange={e => setDocForm(p => ({...p, tanggal_dokumen:e.target.value}))} className={inputStyle} />
            </div>

            {/* Custom drag-drop dropzone */}
            <div className="md:col-span-3">
              <label className={labelStyle}>File Berkas (PDF / Gambar / Zip - Maks 10MB)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-white hover:border-pln-blue-mid hover:bg-slate-50/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all"
              >
                <Upload size={24} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">
                  {docFile ? docFile.name : 'Pilih Berkas Kontrak'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {docFile ? `${(docFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Klik untuk mengunggah berkas pendukung (Maks 10MB)'}
                </span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={e => setDocFile(e.target.files[0] || null)}
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.zip,.docx"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-200 pt-4">
            {docFile && (
              <button onClick={() => { setDocFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="px-5 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-200 bg-white hover:bg-red-50 cursor-pointer">
                Hapus Berkas
              </button>
            )}
            <button 
              onClick={handleSaveDoc} 
              disabled={uploadingDoc || !docForm.nomor_dokumen || !docForm.tanggal_dokumen || !docFile}
              className="px-8 py-2.5 rounded-xl text-xs font-extrabold text-white bg-pln-blue-mid hover:bg-pln-blue cursor-pointer transition-all shadow-sm active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {uploadingDoc ? 'Mengunggah...' : 'Unggah Dokumen'}
            </button>
          </div>
        </div>

        {/* Daftar Dokumen Terunggah */}
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dokumen Terdaftar</h4>
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-4">Memuat data...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 flex flex-col items-center justify-center">
              <FileText size={32} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-400 m-0">Belum ada dokumen BASTP / AMD yang diunggah.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                    <div className={`p-2 rounded-lg flex ${doc.jenis === 'bastp' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-800 truncate m-0">
                        {doc.jenis.toUpperCase()} #{doc.urutan_ke} — {doc.nomor_dokumen}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 m-0">
                        Tanggal Dokumen: {doc.tanggal_dokumen}
                        {doc.user?.name && ` | Diunggah oleh: ${doc.user.name}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {doc.file_path && (
                      <a 
                        href={`/storage/${doc.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                      >
                        <Upload size={14}/>
                      </a>
                    )}
                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
