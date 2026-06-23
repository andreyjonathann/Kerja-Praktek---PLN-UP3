import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN:  'admin',
  PIC_ASET: 'pic_aset',
  PIC_JARINGAN: 'pic_jaringan',
  PIC_TE: 'pic_transaksi_energi',
  PIC_NIAGA: 'pic_niaga',
  PIC_PEMASARAN: 'pic_pemasaran',
  PIC_KEUANGAN: 'pic_keuangan',
}

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
      const message = err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.'
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

  const isAdmin  = user?.role === ROLES.ADMIN
  const isPic    = user?.role?.startsWith('pic_')
  const isViewer = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, isAdmin, isPic, isViewer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
