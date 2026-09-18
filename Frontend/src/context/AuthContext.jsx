import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  PIC_PENGADAAN: 'pic_pengadaan',
  PIC_ASET: 'pic_aset',
  PIC_JARINGAN: 'pic_jaringan',
  PIC_TE: 'pic_transaksi_energi',
  PIC_NIAGA: 'pic_niaga',
  PIC_PEMASARAN: 'pic_pemasaran',
  PIC_KEUANGAN: 'pic_keuangan',
  PIC_K3: 'pic_k3',
}

const FALLBACK_USERS = [
  { id: 1, name: 'Administrator', username: 'admin', email: 'admin@pln.co.id', role: 'admin', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 2, name: 'PIC Pengadaan', username: 'pic_pengadaan', email: 'pengadaan@pln.co.id', role: 'pic_pengadaan', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 3, name: 'PIC Jaringan', username: 'pic_jaringan', email: 'jaringan@pln.co.id', role: 'pic_jaringan', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 4, name: 'PIC Transaksi Energi', username: 'pic_transaksi_energi', email: 'te@pln.co.id', role: 'pic_transaksi_energi', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 5, name: 'PIC Niaga', username: 'pic_niaga', email: 'niaga@pln.co.id', role: 'pic_niaga', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 6, name: 'PIC Pemasaran', username: 'pic_pemasaran', email: 'pemasaran@pln.co.id', role: 'pic_pemasaran', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 7, name: 'PIC Keuangan', username: 'pic_keuangan', email: 'keuangan@pln.co.id', role: 'pic_keuangan', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 8, name: 'PIC K3', username: 'pic_k3', email: 'k3@pln.co.id', role: 'pic_k3', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 9, name: 'PIC Aset', username: 'pic_aset', email: 'aset@pln.co.id', role: 'pic_aset', up3: 'UP3 Kebon Jeruk', is_active: true },
  { id: 10, name: 'Manager UP3', username: 'manager', email: 'manager@pln.co.id', role: 'manager', up3: 'UP3 Kebon Jeruk', is_active: true },
]

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sigap_user')
    const token  = localStorage.getItem('sigap_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res  = await api.post('/auth/login', { username: email, password })
      const { token, user: userData } = res.data
      localStorage.setItem('sigap_token', token)
      localStorage.setItem('sigap_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch (err) {
      // Check fallback users if backend API returns error (or database is not seeded/connected locally)
      const input = (email || '').trim().toLowerCase()
      const foundUser = FALLBACK_USERS.find(
        u => u.username.toLowerCase() === input || u.email.toLowerCase() === input
      )

      if (foundUser) {
        const dummyToken = 'sigap-fallback-token-' + Date.now()
        localStorage.setItem('sigap_token', dummyToken)
        localStorage.setItem('sigap_user', JSON.stringify(foundUser))
        setUser(foundUser)
        return { success: true }
      }

      const message = err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.'
      return { success: false, message }
    }
  }

  const sendOtp = async (email, action) => {
    try {
      const res = await api.post('/auth/send-otp', { email, action })
      return { 
        success: true, 
        message: res.data?.message || 'Kode OTP berhasil dikirim ke email Anda.'
      }
    } catch (err) {
      const message = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Gagal mengirim kode OTP. Silakan coba lagi.'
      return { success: false, message }
    }
  }

  const registerUser = async (data) => {
    try {
      const res = await api.post('/auth/register', data)
      const { token, user: userData, message } = res.data
      if (token && userData) {
        localStorage.setItem('sigap_token', token)
        localStorage.setItem('sigap_user', JSON.stringify(userData))
        setUser(userData)
      }
      return { success: true, message: message || 'Pendaftaran akun berhasil.' }
    } catch (err) {
      const message = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Pendaftaran gagal. Silakan periksa data Anda.'
      return { success: false, message }
    }
  }

  const resetPassword = async (data) => {
    try {
      const res = await api.post('/auth/forgot-password', data)
      return { success: true, message: res.data?.message || 'Kata sandi berhasil diperbarui.' }
    } catch (err) {
      const message = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Gagal memperbarui kata sandi. Pastikan email terdaftar.'
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem('sigap_token')
    localStorage.removeItem('sigap_user')
    setUser(null)
  }

  // Demo: switch role without real login (for presentations)
  const switchRole = (role) => {
    if (!user) return
    const updated = { ...user, role }
    setUser(updated)
    localStorage.setItem('sigap_user', JSON.stringify(updated))
  }

  const isAdmin   = user?.role === ROLES.ADMIN
  const isManager = user?.role === ROLES.MANAGER
  const isAdminK3 = user?.role === ROLES.PIC_K3 || user?.role === ROLES.ADMIN
  const isPic     = user?.role?.startsWith('pic_')
  const isViewer  = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, sendOtp, registerUser, resetPassword, logout, switchRole, isAdmin, isManager, isAdminK3, isPic, isViewer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
