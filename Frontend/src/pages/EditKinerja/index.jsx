import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import {
  Clock, Zap, RadioTower, Factory, ChevronDown, ChevronRight,
  Save, ArrowLeft, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

// ─── Konfigurasi SAIDI / SAIFI ─────────────────────────────────────────────────
const CONFIG = {
  saidi: {
    label: 'SAIDI',
    unit: 'Menit/Pelanggan',
    icon: Clock,
    color: '#2563EB',
    apiKey: 'saidi',
    prefix: 'saidi_',
    distribusiKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam'],
    standaloneKeys: ['transmisi', 'pembangkit'],
    labels: {
      distribusi_padam_tidak_terencana: 'Padam Tidak Terencana',
      distribusi_padam_terencana: 'Padam Terencana',
      distribusi_bencana_alam: 'Bencana Alam',
      transmisi: 'Transmisi',
      pembangkit: 'Pembangkit',
    },
  },
  saifi: {
    label: 'SAIFI',
    unit: 'Kali/Pelanggan',
    icon: Zap,
    color: '#7C3AED',
    apiKey: 'saifi',
    prefix: 'saifi_',
    distribusiKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam'],
    standaloneKeys: ['transmisi', 'pembangkit'],
    labels: {
      distribusi_padam_tidak_terencana: 'Padam Tidak Terencana',
      distribusi_padam_terencana: 'Padam Terencana',
      distribusi_bencana_alam: 'Bencana Alam',
      transmisi: 'Transmisi',
      pembangkit: 'Pembangkit',
    },
  },
};

// ─── Field number input ────────────────────────────────────────────────────────
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
          fontFamily: 'monospace', boxSizing: 'border-box',
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EditKinerjaPage() {
  const navigate = useNavigate();
  const { type, bulan, tahun } = useParams();  // route: /:type/edit/:bulan/:tahun
  const cfg = CONFIG[type];

  const [loadingData, setLoadingData] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [status,      setStatus]      = useState(null); // 'success' | 'error'
  const [statusMsg,   setStatusMsg]   = useState('');
  const [isDistribusiOpen, setIsDistribusiOpen] = useState(true);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  // Semua field names dengan prefix (e.g. saidi_distribusi_padam_tidak_terencana)
  const allFieldNames = cfg
    ? [...cfg.distribusiKeys, ...cfg.standaloneKeys].map(k => cfg.prefix + k)
    : [];

  // Live watch untuk total preview
  const watchedValues = useWatch({ control, name: allFieldNames });
  const liveTotal = (watchedValues || []).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  // Fetch existing data
  useEffect(() => {
    if (!cfg || !bulan || !tahun) return;
    setLoadingData(true);
    api.get(`/jaringan/dashboard?tahun=${tahun}`)
      .then(res => {
        const rows = res.data?.[cfg.apiKey] || [];
        const row  = rows.find(d => parseInt(d.bulan) === parseInt(bulan));

        const defaults = { periode_id: bulan, tahun };

        if (row) {
          // Backend mengembalikan key tanpa prefix (distribusi_padam_tidak_terencana, transmisi, dst.)
          [...cfg.distribusiKeys, ...cfg.standaloneKeys].forEach(k => {
            const val = row[k];
            defaults[cfg.prefix + k] = val != null ? val : '';
          });
        }

        reset(defaults);
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setStatusMsg('Gagal memuat data existing. Periksa koneksi server.');
      })
      .finally(() => setLoadingData(false));
  }, [type, bulan, tahun]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setSaving(true);
    setStatus(null);
    try {
      await api.post('/kinerja/jaringan', data);
      setStatus('success');
      setStatusMsg('Data berhasil disimpan!');
      navigate(`/${type}`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err?.response?.data?.message || 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
        Tipe tidak dikenal: <strong>{type}</strong>. Gunakan "saidi" atau "saifi".
      </div>
    );
  }

  const Icon      = cfg.icon;
  const bulanName = MONTHS[parseInt(bulan) - 1]?.label || `Bulan ${bulan}`;
  const standaloneColors = { transmisi: '#EF4444', pembangkit: '#F59E0B' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
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
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}0a)`,
          border: `1px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} style={{ color: cfg.color }} />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Edit {cfg.label} — {bulanName} {tahun}
          </h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Satuan: {cfg.unit}
          </p>
        </div>
      </div>

      {/* ── Status banner ─────────────────────────────────────────────────── */}
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

      {/* ── Loading ───────────────────────────────────────────────────────── */}
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

          {/* Hidden */}
          <input type="hidden" {...register('periode_id')} />
          <input type="hidden" {...register('tahun')} />

          {/* ── Live Total Preview ─────────────────────────────────────── */}
          <div style={{
            padding: '13px 18px', borderRadius: 12,
            background: `linear-gradient(135deg, ${cfg.color}12, ${cfg.color}05)`,
            border: `1px solid ${cfg.color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total {cfg.label} (preview)
            </span>
            <span style={{ fontSize: '1.18rem', fontWeight: 800, color: cfg.color, fontFamily: 'monospace' }}>
              {liveTotal.toFixed(4)}
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>
                {cfg.unit}
              </span>
            </span>
          </div>

          {/* ── DISTRIBUSI accordion ───────────────────────────────────── */}
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
                {cfg.distribusiKeys.map(k => (
                  <FieldInput
                    key={k}
                    name={cfg.prefix + k}
                    label={cfg.labels[k]}
                    register={register}
                    errors={errors}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Transmisi & Pembangkit ─────────────────────────────────── */}
          {cfg.standaloneKeys.map(k => {
            const color = standaloneColors[k] || '#64748b';
            return (
              <div key={k} className="card" style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {k === 'transmisi'
                    ? <RadioTower size={13} style={{ color }} />
                    : <Factory size={13} style={{ color }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }}>
                    {cfg.labels[k].toUpperCase()}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    {...register(cfg.prefix + k, { min: { value: 0, message: 'Tidak boleh negatif' } })}
                    placeholder="0.0000"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1px solid ${errors[cfg.prefix + k] ? '#EF4444' : 'var(--border)'}`,
                      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                      fontSize: '0.92rem', fontWeight: 600, outline: 'none',
                      fontFamily: 'monospace', boxSizing: 'border-box',
                    }}
                  />
                  {errors[cfg.prefix + k] && (
                    <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 3 }}>
                      {errors[cfg.prefix + k].message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '13px 0', borderRadius: 12, border: 'none',
              background: saving ? '#93c5fd' : cfg.color,
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
              boxShadow: saving ? 'none' : `0 4px 14px ${cfg.color}44`,
              marginTop: 4,
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
              : <><Save size={15} /> Simpan Perubahan</>
            }
          </button>
        </form>
      )}
    </div>
  );
}
