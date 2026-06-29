import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Lock, Mail, AlertCircle, LogIn } from 'lucide-react'
import PlnLogo from '@/components/ui/PlnLogo'

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F7FC',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px',
    }}>
      {/* Background decorations matching screenshot */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {/* Top-left soft gradient */}
        <div style={{
          position: 'absolute', width: 550, height: 550, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 162, 186,0.08) 0%, transparent 70%)',
          top: -200, left: -150,
        }} />
        
        {/* Bottom-right soft gradient */}
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 162, 186,0.1) 0%, transparent 70%)',
          bottom: -250, right: -150,
        }} />

        {/* Curved Wave line overlay top-left */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '40vw', height: 'auto', opacity: 0.15, fill: 'none' }} viewBox="0 0 500 500">
          <path d="M-50,150 C150,100 250,300 450,200" stroke="#14A2BA" strokeWidth="4" />
          <path d="M-50,200 C150,150 250,350 450,250" stroke="#14A2BA" strokeWidth="1.5" />
        </svg>

        {/* Curved Wave line overlay bottom-right */}
        <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '45vw', height: 'auto', opacity: 0.18, fill: 'none' }} viewBox="0 0 500 500">
          <path d="M50,350 C250,250 300,450 550,300" stroke="#14A2BA" strokeWidth="4" />
          <path d="M100,400 C300,300 350,500 600,350" stroke="#14A2BA" strokeWidth="2" />
        </svg>

        {/* Dot pattern grids (left and right) */}
        <svg width="80" height="120" style={{ position: 'absolute', top: '25%', left: '8%', opacity: 0.25 }} viewBox="0 0 80 120">
          <pattern id="dot-pattern-login-1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.5" fill="#14A2BA" />
          </pattern>
          <rect width="80" height="120" fill="url(#dot-pattern-login-1)" />
        </svg>

        <svg width="80" height="120" style={{ position: 'absolute', top: '15%', right: '8%', opacity: 0.25 }} viewBox="0 0 80 120">
          <pattern id="dot-pattern-login-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.5" fill="#14A2BA" />
          </pattern>
          <rect width="80" height="120" fill="url(#dot-pattern-login-2)" />
        </svg>

        {/* Transmission tower watermark bottom-right */}
        <svg style={{ position: 'absolute', right: '4%', bottom: '5%', height: '50%', width: 'auto', opacity: 0.08 }} viewBox="0 0 400 800" fill="none" stroke="#14A2BA" strokeWidth="4">
          <path d="M120 750 L280 750 M140 750 L180 500 L220 500 L260 750 M180 500 L190 300 L210 300 L220 500 M190 300 L195 100 L205 100 L210 300 M195 100 L200 20 L205 100" />
          <path d="M150 620 L250 620 M170 500 L230 500 M185 380 L215 380 M190 300 L210 300 M193 200 L207 200" />
          <path d="M80 380 L320 380 M100 300 L300 300 M120 200 L280 200" />
          <path d="M140 750 L220 500 M260 750 L180 500 M180 500 L210 300 M220 500 L190 300 M190 300 L205 100 M210 300 L195 100" />
          <path d="M150 620 L180 500 M250 620 L220 500 M170 500 L190 380 M230 500 L210 380 M185 380 L195 300 M215 380 L205 300" />
        </svg>

        {/* City skyline transparent watermark at bottom-right */}
        <svg style={{ position: 'absolute', right: 0, bottom: 0, width: '50vw', height: 'auto', opacity: 0.06 }} viewBox="0 0 800 200" fill="#14A2BA">
          <path d="M0,200 L800,200 L800,160 L780,160 L780,180 L760,180 L760,150 L750,150 L750,180 L730,180 L730,130 L710,130 L710,180 L680,180 L680,140 L650,140 L650,180 L630,180 L630,120 L610,120 L610,180 L580,180 L580,150 L560,150 L560,180 L540,180 L540,110 L520,110 L520,180 L490,180 L490,135 L470,135 L470,180 L440,180 L440,160 L420,160 L420,180 L390,180 L390,120 L370,120 L370,180 L340,180 L340,145 L320,145 L320,180 L300,180 L300,100 L280,100 L280,180 L250,180 L250,130 L230,130 L230,180 L200,180 L200,150 L180,150 L180,180 L160,180 L160,115 L140,115 L140,180 L110,180 L110,140 L90,140 L90,180 L60,180 L60,130 L40,130 L40,180 L0,180 Z" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Branding header matching mock-up */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <PlnLogo size={52} showText={false} />
            <span style={{ fontSize: '2.5rem', fontWeight: 950, color: '#14A2BA', letterSpacing: '1px' }}>PLN</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            Dashboard Monitoring Pekerjaan Harian
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#14A2BA', fontWeight: 700, marginTop: 4 }}>
            UP3 Kebon Jeruk
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(20, 162, 186, 0.06), 0 0 0 1px rgba(20, 162, 186, 0.04)',
          overflow: 'hidden',
          width: '100%',
        }}>
          {/* Card Header with Blue PLN Gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #14A2BA, #14A2BA, #14A2BA)',
            padding: '26px 24px 28px',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Yellow curve line overlay */}
            <svg style={{ position: 'absolute', left: 0, bottom: 0, width: 140, height: 70, opacity: 0.8 }} viewBox="0 0 140 70">
              <path d="M-10,80 Q 40,20 150,80" fill="none" stroke="#FFE000" strokeWidth="4" />
            </svg>

            {/* Transmission tower watermark on header card */}
            <svg style={{ position: 'absolute', right: 16, bottom: -10, height: '90%', opacity: 0.12 }} viewBox="0 0 100 200" fill="none" stroke="#FFFFFF" strokeWidth="2">
              <path d="M20 180 L80 180 M30 180 L45 120 L55 120 L70 180 M45 120 L48 60 L52 60 L55 120 M48 60 L50 10 L52 60" />
              <path d="M35 150 L65 150 M40 120 L60 120 M44 90 L56 90" />
              <path d="M10 90 L90 90 M15 60 L85 60 M20 30 L80 30" />
            </svg>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, textAlign: 'center', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Masuk ke Dashboard
            </h3>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, textAlign: 'center', fontWeight: 500 }}>
              Gunakan kredensial akun PLN Anda
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '32px 32px 28px' }}>
            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 20,
              }}>
                <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Username atau Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      height: 46,
                      paddingLeft: 42,
                      paddingRight: 14,
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'all 0.15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#14A2BA';
                      e.target.style.boxShadow = '0 0 0 3px rgba(20, 162, 186, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="nama@pln.co.id"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Kata Sandi
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    style={{
                      width: '100%',
                      height: 46,
                      paddingLeft: 42,
                      paddingRight: 44,
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'all 0.15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#14A2BA';
                      e.target.style.boxShadow = '0 0 0 3px rgba(20, 162, 186, 0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 46,
                  width: '100%',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: 6,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #14A2BA, #14A2BA)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 8px 20px rgba(20, 162, 186, 0.2)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '0.95';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(20, 162, 186, 0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 162, 186, 0.2)';
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
                    Memproses...
                  </span>
                ) : (
                  <>
                    <LogIn size={16} style={{ transform: 'rotate(0deg)' }} />
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: 28, fontWeight: 500 }}>
          PT PLN (Persero) &bull; UP3 Kebon Jeruk &bull; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
