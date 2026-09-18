import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Lock, Mail, AlertCircle, LogIn, User, UserPlus, KeyRound, CheckCircle2, ArrowLeft, Send, ShieldCheck } from 'lucide-react'
import PlnLogo from '@/components/ui/PlnLogo'

export default function LoginPage() {
  const { user, login, sendOtp, registerUser, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    otp_code: '',
    role: 'pic_jaringan',
    up3: 'UP3 Kebon Jeruk',
  })
  
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPwConf, setShowPwConf] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
    setOtpSent(false)
    setForm(p => ({
      ...p,
      password: '',
      password_confirmation: '',
      otp_code: '',
    }))
  }

  const handleSendOtpClick = async (actionType) => {
    if (!form.email || !form.email.includes('@')) {
      setError('Silakan masukkan alamat Gmail / Email yang valid.')
      return
    }
    setError('')
    setSuccessMsg('')
    setSendingOtp(true)

    const res = await sendOtp(form.email, actionType)
    setSendingOtp(false)

    if (res.success) {
      setOtpSent(true)
      setSuccessMsg(res.message)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setError(res.message)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    const result = await login(form.email, form.password)
    if (!result.success) setError(result.message)
    setLoading(false)
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!form.otp_code || form.otp_code.trim().length !== 6) {
      setError('Masukkan kode verifikasi OTP 6-digit yang dikirim ke Gmail Anda.')
      return
    }

    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    const result = await registerUser({
      name: form.name,
      username: form.username || form.email.split('@')[0],
      email: form.email,
      otp_code: form.otp_code.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      role: form.role,
      up3: form.up3,
    })

    setLoading(false)
    if (result.success) {
      setSuccessMsg(result.message || 'Pendaftaran akun berhasil! Verifikasi email berhasil.')
    } else {
      setError(result.message)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!form.otp_code || form.otp_code.trim().length !== 6) {
      setError('Masukkan kode verifikasi OTP 6-digit yang dikirim ke Gmail Anda.')
      return
    }

    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    const result = await resetPassword({
      email: form.email,
      otp_code: form.otp_code.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
    })

    setLoading(false)
    if (result.success) {
      setSuccessMsg(result.message || 'Kata sandi berhasil diperbarui! Mengalihkan ke halaman login...')
      setTimeout(() => {
        handleModeSwitch('login')
      }, 2500)
    } else {
      setError(result.message)
    }
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
        <div style={{
          position: 'absolute', width: 550, height: 550, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 162, 186,0.08) 0%, transparent 70%)',
          top: -200, left: -150,
        }} />
        
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 162, 186,0.1) 0%, transparent 70%)',
          bottom: -250, right: -150,
        }} />

        <svg style={{ position: 'absolute', top: 0, left: 0, width: '40vw', height: 'auto', opacity: 0.15, fill: 'none' }} viewBox="0 0 500 500">
          <path d="M-50,150 C150,100 250,300 450,200" stroke="#14A2BA" strokeWidth="4" />
          <path d="M-50,200 C150,150 250,350 450,250" stroke="#14A2BA" strokeWidth="1.5" />
        </svg>

        <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '45vw', height: 'auto', opacity: 0.18, fill: 'none' }} viewBox="0 0 500 500">
          <path d="M50,350 C250,250 300,450 550,300" stroke="#14A2BA" strokeWidth="4" />
          <path d="M100,400 C300,300 350,500 600,350" stroke="#14A2BA" strokeWidth="2" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Branding header matching mock-up */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
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
            background: 'linear-gradient(135deg, #14A2BA, #14A2BA, #0D9488)',
            padding: '24px 24px 26px',
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

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.01em' }}>
              {mode === 'login' && 'Masuk ke Dashboard'}
              {mode === 'register' && 'Daftar Akun (Verifikasi Gmail)'}
              {mode === 'forgot' && 'Verifikasi OTP & Atur Ulang Kata Sandi'}
            </h3>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, textAlign: 'center', fontWeight: 500 }}>
              {mode === 'login' && 'Gunakan kredensial akun PLN Anda'}
              {mode === 'register' && 'Verifikasi alamat Gmail Anda dengan kode OTP'}
              {mode === 'forgot' && 'Kode OTP 6-digit dikirim ke alamat Gmail Anda'}
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '28px 28px 24px' }}>
            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 20,
              }}>
                <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 20,
              }}>
                <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 600, margin: 0 }}>{successMsg}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Username atau Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type="text"
                      style={{
                        width: '100%', height: 46, paddingLeft: 42, paddingRight: 14,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none', transition: 'all 0.15s',
                      }}
                      placeholder="nama@pln.co.id atau username"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      style={{ background: 'none', border: 'none', color: '#14A2BA', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      style={{
                        width: '100%', height: 46, paddingLeft: 42, paddingRight: 44,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none', transition: 'all 0.15s',
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
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 46, width: '100%', fontSize: '0.9rem', fontWeight: 700, marginTop: 4,
                    borderRadius: 12, background: 'linear-gradient(135deg, #14A2BA, #0D9488)',
                    color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 20px rgba(20, 162, 186, 0.2)', transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Memproses...' : (
                    <>
                      <LogIn size={16} />
                      Masuk ke Dashboard
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Belum memiliki akun? </span>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('register')}
                    style={{ background: 'none', border: 'none', color: '#14A2BA', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    Daftar Akun Baru
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Nama Lengkap
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type="text"
                      style={{
                        width: '100%', height: 42, paddingLeft: 42, paddingRight: 14,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="Masukkan nama lengkap"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      style={{
                        width: '100%', height: 42, paddingLeft: 12, paddingRight: 12,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="username"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Peran (Role)
                    </label>
                    <select
                      style={{
                        width: '100%', height: 42, paddingLeft: 10, paddingRight: 10,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.8125rem', color: '#0F172A', outline: 'none', fontWeight: 600,
                      }}
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    >
                      <option value="pic_jaringan">PIC Jaringan</option>
                      <option value="pic_pemasaran">PIC Pemasaran</option>
                      <option value="pic_transaksi_energi">PIC Transaksi Energi</option>
                      <option value="pic_niaga">PIC Niaga</option>
                      <option value="pic_keuangan">PIC Keuangan</option>
                      <option value="pic_pengadaan">PIC Pengadaan</option>
                      <option value="pic_k3">PIC K3</option>
                      <option value="admin">Administrator</option>
                      <option value="manager">Manager (View Only)</option>
                      <option value="viewer">Viewer / Management</option>
                    </select>
                  </div>
                </div>

                {/* Email with Send OTP Button */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Alamat Gmail / Email
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                      <input
                        type="email"
                        style={{
                          width: '100%', height: 42, paddingLeft: 42, paddingRight: 14,
                          borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                          fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                        }}
                        placeholder="nama@gmail.com"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      disabled={sendingOtp || countdown > 0}
                      onClick={() => handleSendOtpClick('register')}
                      style={{
                        padding: '0 14px', height: 42, borderRadius: 12,
                        background: countdown > 0 ? '#E2E8F0' : 'rgba(20, 162, 186, 0.1)',
                        color: countdown > 0 ? '#94A3B8' : '#14A2BA',
                        border: '1px solid rgba(20, 162, 186, 0.3)',
                        fontSize: '0.78rem', fontWeight: 700, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {sendingOtp ? 'Mengirim...' : countdown > 0 ? `Tunggu (${countdown}s)` : (
                        <>
                          <Send size={14} /> Kirim OTP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* OTP Code Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Kode Verifikasi OTP (6 Digit)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type="text"
                      maxLength={6}
                      style={{
                        width: '100%', height: 42, paddingLeft: 42, paddingRight: 14,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', outline: 'none',
                        letterSpacing: '3px', fontFamily: 'monospace',
                      }}
                      placeholder="123456"
                      value={form.otp_code}
                      onChange={e => setForm(p => ({ ...p, otp_code: e.target.value.replace(/[^0-9]/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Kata Sandi
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      style={{
                        width: '100%', height: 42, paddingLeft: 42, paddingRight: 44,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="Minimal 6 karakter"
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
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Konfirmasi Kata Sandi
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type={showPwConf ? 'text' : 'password'}
                      style={{
                        width: '100%', height: 42, paddingLeft: 42, paddingRight: 44,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="Ulangi kata sandi"
                      value={form.password_confirmation}
                      onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwConf(p => !p)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4,
                      }}
                    >
                      {showPwConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 44, width: '100%', fontSize: '0.9rem', fontWeight: 700, marginTop: 4,
                    borderRadius: 12, background: 'linear-gradient(135deg, #14A2BA, #0D9488)',
                    color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 20px rgba(20, 162, 186, 0.2)', transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Verifikasi & Mendaftarkan...' : (
                    <>
                      <UserPlus size={16} />
                      Verifikasi OTP &amp; Daftar Akun
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Sudah memiliki akun? </span>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    style={{ background: 'none', border: 'none', color: '#14A2BA', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    Masuk ke Dashboard
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Email Terdaftar
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                      <input
                        type="email"
                        style={{
                          width: '100%', height: 44, paddingLeft: 42, paddingRight: 14,
                          borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                          fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                        }}
                        placeholder="nama@gmail.com"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      disabled={sendingOtp || countdown > 0}
                      onClick={() => handleSendOtpClick('reset_password')}
                      style={{
                        padding: '0 14px', height: 44, borderRadius: 12,
                        background: countdown > 0 ? '#E2E8F0' : 'rgba(20, 162, 186, 0.1)',
                        color: countdown > 0 ? '#94A3B8' : '#14A2BA',
                        border: '1px solid rgba(20, 162, 186, 0.3)',
                        fontSize: '0.78rem', fontWeight: 700, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {sendingOtp ? 'Mengirim...' : countdown > 0 ? `Tunggu (${countdown}s)` : (
                        <>
                          <Send size={14} /> Kirim OTP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Kode Verifikasi OTP (6 Digit)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type="text"
                      maxLength={6}
                      style={{
                        width: '100%', height: 44, paddingLeft: 42, paddingRight: 14,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', outline: 'none',
                        letterSpacing: '3px', fontFamily: 'monospace',
                      }}
                      placeholder="123456"
                      value={form.otp_code}
                      onChange={e => setForm(p => ({ ...p, otp_code: e.target.value.replace(/[^0-9]/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Kata Sandi Baru
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      style={{
                        width: '100%', height: 44, paddingLeft: 42, paddingRight: 44,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="Minimal 6 karakter"
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
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#14A2BA' }} />
                    <input
                      type={showPwConf ? 'text' : 'password'}
                      style={{
                        width: '100%', height: 44, paddingLeft: 42, paddingRight: 44,
                        borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF',
                        fontSize: '0.875rem', color: '#0F172A', outline: 'none',
                      }}
                      placeholder="Ulangi kata sandi baru"
                      value={form.password_confirmation}
                      onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwConf(p => !p)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4,
                      }}
                    >
                      {showPwConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 44, width: '100%', fontSize: '0.9rem', fontWeight: 700, marginTop: 4,
                    borderRadius: 12, background: 'linear-gradient(135deg, #14A2BA, #0D9488)',
                    color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 20px rgba(20, 162, 186, 0.2)', transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Verifikasi & Memperbarui...' : (
                    <>
                      <KeyRound size={16} />
                      Verifikasi OTP &amp; Perbarui Kata Sandi
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    style={{ background: 'none', border: 'none', color: '#14A2BA', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={14} /> Kembali ke Halaman Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: 24, fontWeight: 500 }}>
          PT PLN (Persero) &bull; UP3 Kebon Jeruk &bull; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
