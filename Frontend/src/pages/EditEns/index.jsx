import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import {
  CloudLightning, RadioTower, Factory, ChevronDown, ChevronRight,
  Save, ArrowLeft, CheckCircle, AlertCircle, Loader2, Trash2
} from 'lucide-react';

function FieldInput({ name, label, register, errors }) {
  return (
    <div style={{ paddingTop: 12 }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type="number"
        step="0.0001"
        min="0"
        {...register(name, { min: { value: 0, message: 'Tidak boleh negatif' } })}
        placeholder="0.0000"
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${errors[name] ? '#EF4444' : 'var(--border)'}`,
          background: 'var(--bg-elevated)', color: 'var(--text-primary)',
          fontSize: '0.92rem', fontWeight: 600, outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {errors[name] && (
        <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 3 }}>
          {errors[name].message}
        </p>
      )}
    </div>
  );
}

export default function EditEnsPage() {
  const navigate = useNavigate();
  const { bulan, tahun } = useParams();

  const [loadingData, setLoadingData] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [status,      setStatus]      = useState(null); 
  const [statusMsg,   setStatusMsg]   = useState('');
  const [isDistribusiOpen, setIsDistribusiOpen] = useState(true);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  const allFieldNames = [
    'distribusi_padam_tidak_terencana',
    'distribusi_padam_terencana',
    'distribusi_bencana_alam',
    'transmisi',
    'pembangkit'
  ];

  const watchedValues = useWatch({ control, name: allFieldNames });
  const liveTotal = (watchedValues || []).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  useEffect(() => {
    if (!bulan || !tahun) return;
    setLoadingData(true);
    api.get(`/jaringan/dashboard?tahun=${tahun}`)
      .then(res => {
        const rows = res.data?.ensPageData || [];
        const row  = rows.find(d => parseInt(d.bulan) === parseInt(bulan));

        const defaults = { periode_id: bulan, tahun };

        if (row && row.bulanan) {
          defaults['distribusi_padam_tidak_terencana'] = row.bulanan.padam_tidak_terencana != null ? row.bulanan.padam_tidak_terencana : '';
          defaults['distribusi_padam_terencana'] = row.bulanan.padam_terencana != null ? row.bulanan.padam_terencana : '';
          defaults['distribusi_bencana_alam'] = row.bulanan.bencana_alam != null ? row.bulanan.bencana_alam : '';
          defaults['transmisi'] = row.bulanan.transmisi != null ? row.bulanan.transmisi : '';
          defaults['pembangkit'] = row.bulanan.pembangkit != null ? row.bulanan.pembangkit : '';
        }

        reset(defaults);
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setStatusMsg('Gagal memuat data existing. Periksa koneksi server.');
      })
      .finally(() => setLoadingData(false));
  }, [bulan, tahun]);

  const onSubmit = async (data) => {
    setSaving(true);
    setStatus(null);
    try {
      await api.post('/jaringan/ens', data);
      setStatus('success');
      setStatusMsg('Data berhasil disimpan!');
      setTimeout(() => navigate('/ens'), 1000);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err?.response?.data?.message || 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Yakin ingin menghapus data ENS bulan ini?')) {
      setDeleting(true);
      setStatus(null);
      try {
        await api.delete('/jaringan/ens', { data: { bulan, tahun } });
        setStatus('success');
        setStatusMsg('Data berhasil dihapus!');
        setTimeout(() => navigate('/ens'), 1000);
      } catch (err) {
        setStatus('error');
        setStatusMsg(err?.response?.data?.message || 'Gagal menghapus data. Coba lagi.');
        setDeleting(false);
      }
    }
  };

  const Icon      = CloudLightning;
  const bulanName = MONTHS[parseInt(bulan) - 1]?.label || `Bulan ${bulan}`;
  const color = '#F59E0B'; // Amber
  const standaloneColors = { transmisi: '#EF4444', pembangkit: '#F59E0B' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '40px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          title="Kembali"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} style={{ color: color }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Edit ENS — {bulanName} {tahun}
          </h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Satuan: kWh
          </p>
        </div>
      </div>

      {status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 10,
          background: status === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: status === 'success' ? '#16a34a' : '#dc2626',
          fontWeight: 600, fontSize: '0.86rem',
        }}>
          {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {statusMsg}
        </div>
      )}

      {loadingData ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 12, color: 'var(--text-muted)',
        }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 600 }}>Memuat data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" {...register('periode_id')} />
          <input type="hidden" {...register('tahun')} />

          <div style={{
            padding: '13px 18px', borderRadius: 12,
            background: `linear-gradient(135deg, ${color}12, ${color}05)`,
            border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total ENS (preview)
            </span>
            <span style={{ fontSize: '1.18rem', fontWeight: 800, color: color }}>
              {liveTotal.toFixed(4)}
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>
                kWh
              </span>
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsDistribusiOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '13px 18px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: '#2563EB18', border: '1px solid #2563EB30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RadioTower size={13} style={{ color: '#2563EB' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.87rem', letterSpacing: '0.03em' }}>
                  DISTRIBUSI
                </span>
              </div>
              {isDistribusiOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>

            {isDistribusiOpen && (
              <div style={{
                padding: '2px 18px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 0,
              }}>
                <FieldInput name="distribusi_padam_tidak_terencana" label="Padam Tidak Terencana" register={register} errors={errors} />
                <FieldInput name="distribusi_padam_terencana" label="Padam Terencana" register={register} errors={errors} />
                <FieldInput name="distribusi_bencana_alam" label="Bencana Alam" register={register} errors={errors} />
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${standaloneColors.transmisi}18`, border: `1px solid ${standaloneColors.transmisi}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RadioTower size={13} style={{ color: standaloneColors.transmisi }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }}>
                TRANSMISI
              </label>
              <input type="number" step="0.0001" min="0" {...register('transmisi', { min: { value: 0, message: 'Tidak boleh negatif' } })} placeholder="0.0000" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${errors['transmisi'] ? '#EF4444' : 'var(--border)'}`, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${standaloneColors.pembangkit}18`, border: `1px solid ${standaloneColors.pembangkit}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Factory size={13} style={{ color: standaloneColors.pembangkit }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }}>
                PEMBANGKIT
              </label>
              <input type="number" step="0.0001" min="0" {...register('pembangkit', { min: { value: 0, message: 'Tidak boleh negatif' } })} placeholder="0.0000" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${errors['pembangkit'] ? '#EF4444' : 'var(--border)'}`, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid #fecaca',
                background: deleting ? '#fecaca' : '#fef2f2',
                color: '#dc2626', fontWeight: 700, fontSize: '0.95rem',
                cursor: (saving || deleting) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              {deleting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menghapus...</> : <><Trash2 size={15} /> Hapus Data</>}
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              style={{
                flex: 2, padding: '13px 0', borderRadius: 12, border: 'none',
                background: saving ? '#93c5fd' : color,
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: (saving || deleting) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
                boxShadow: saving ? 'none' : `0 4px 14px ${color}44`,
              }}
            >
              {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
