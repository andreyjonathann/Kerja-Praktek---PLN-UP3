import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, Zap, Shield, BarChart3, Activity } from 'lucide-react'
import PlnLogo from '@/components/ui/PlnLogo'

const FEATURES = [
  { icon: BarChart3,   label: '16 Dashboard Analitik Real-Time' },
  { icon: Activity,    label: 'SAIDI, SAIFI, ENS & Gangguan Monitor' },
  { icon: Zap,         label: 'Integrasi Spreadsheet Excel Otomatis' },
  { icon: Shield,      label: 'Role-Based Access (Admin / PIC / Viewer)' },
]

export default function LoginPage() {
  const { user, login } = useAuth()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(form.email, form.password)
    if (!result.success) setError(result.message)
    setLoading(false)
  }

  const demoLogin = (email, password) => setForm({ email, password })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#080E1C',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
        top: -200, left: -100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,91,172,0.1) 0%, transparent 70%)',
        bottom: -150, right: 100, pointerEvents: 'none',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* ── Left Panel ────────────────────────────────────── */}
      <div style={{
        flex: 1.1, display: 'none', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 64px',
        position: 'relative', zIndex: 1,
      }} className="hidden lg:flex">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 52 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18, overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 0 32px rgba(255,209,0,0.2)',
          }}>
            <PlnLogo size={68} showText={false} />
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#EEF4FF', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              SIGAP PLN
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4A6080', fontWeight: 500, marginTop: 3 }}>
              Sistem Informasi &amp; Dashboard Kinerja
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-0.03em', color: '#EEF4FF', marginBottom: 8,
        }}>
          Dashboard Monitoring
        </h1>
        <h1 style={{
          fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #FFD100, #F59E0B)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: 24,
        }}>
          UP3 Kebon Jeruk
        </h1>

        <p style={{ fontSize: '0.9375rem', color: '#8BA3C4', lineHeight: 1.7, maxWidth: 420, marginBottom: 48 }}>
          Platform enterprise untuk monitoring KPI, keandalan jaringan, gangguan, penjualan, dan kinerja operasional PLN UP3 Kebon Jeruk secara real-time.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={16} style={{ color: '#60A5FA' }} />
              </div>
              <span style={{ fontSize: '0.875rem', color: '#8BA3C4', fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B98180' }} />
          <span style={{ fontSize: '0.75rem', color: '#3D5470', fontWeight: 500 }}>
            Sistem Online · PT PLN (Persero) · 2026
          </span>
        </div>
      </div>

      {/* ── Right Panel — Login Form ─────────────────────── */}
      <div style={{
        flex: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 40px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }} className="lg:hidden">
            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              <PlnLogo size={44} showText={false} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#EEF4FF' }}>SIGAP PLN</div>
              <div style={{ fontSize: '0.7rem', color: '#FFD100', fontWeight: 600 }}>UP3 Kebon Jeruk</div>
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(15,30,53,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '36px 36px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.08)',
          }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Masuk ke Dashboard
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#4A6080' }}>
                Gunakan kredensial akun PLN Anda
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 20,
              }}>
                <AlertCircle size={15} style={{ color: '#FCA5A5', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8125rem', color: '#FCA5A5' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8BA3C4', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D5470' }} />
                  <input
                    type="email"
                    className="input"
                    style={{ paddingLeft: 36, height: 44 }}
                    placeholder="nama@pln.co.id"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8BA3C4', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Kata Sandi
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D5470' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 40, height: 44 }}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#3D5470', padding: 4,
                    }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ height: 46, width: '100%', fontSize: '0.9rem', marginTop: 4, borderRadius: 12 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
                    Masuk...
                  </span>
                ) : 'Masuk ke Dashboard'}
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3D5470', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Akun Demo
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Admin',  email: 'admin@pln.co.id',  pw: 'admin123',  color: '#FCA5A5',  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
                  { label: 'PIC',    email: 'pic@pln.co.id',    pw: 'pic123',    color: '#FCD34D',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
                  { label: 'Viewer', email: 'viewer@pln.co.id', pw: 'viewer123', color: '#34D399',  bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
                ].map(acc => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => demoLogin(acc.email, acc.pw)}
                    style={{
                      padding: '8px 6px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
                      background: acc.bg, color: acc.color, border: `1px solid ${acc.border}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${acc.border}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.65rem', color: '#3D5470', marginTop: 8, textAlign: 'center' }}>
                Klik role → otomatis isi form → klik Masuk
              </p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#3D5470', marginTop: 20 }}>
            PT PLN (Persero) · UP3 Kebon Jeruk · 2026
          </p>
        </div>
      </div>
    </div>
  )
}
