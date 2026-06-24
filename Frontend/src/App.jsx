import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { FilterProvider } from '@/context/FilterContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Layout from '@/components/layout/Layout'

// Pages
import LoginPage from '@/pages/Login'
import OverviewPage from '@/pages/Overview'
import SaidiPage from '@/pages/Saidi'
import SaifiPage from '@/pages/Saifi'
import GangguanPage from '@/pages/Gangguan'
import NkoPage from '@/pages/Nko'
import EnsPage from '@/pages/Ens'
import PlaceholderPage from '@/pages/Placeholder'
import InputKinerjaPage from '@/pages/InputKinerja'
import InputSaifiPage from '@/pages/InputSaifi'
import KelolaTargetPage from '@/pages/KelolaTarget'
import RatingNegatifPage from '@/pages/RatingNegatif'
import InputRatingNegatifPage from '@/pages/InputRatingNegatif'
import GangguanTmPage from '@/pages/GangguanTm'
import InputGangguanTmPage from '@/pages/InputGangguanTm'
// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-pln-blue-mid" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-xs text-slate-500 font-semibold animate-pulse">Menghubungkan ke SIGAP...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected dashboard routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <OverviewPage />
                </ProtectedRoute>
              } />

              <Route path="/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage />
                </ProtectedRoute>
              } />

              <Route path="/input-saifi" element={
                <ProtectedRoute>
                  <InputSaifiPage />
                </ProtectedRoute>
              } />

              <Route path="/kelola-target" element={
                <ProtectedRoute>
                  <KelolaTargetPage />
                </ProtectedRoute>
              } />


              <Route path="/saidi" element={
                <ProtectedRoute>
                  <SaidiPage />
                </ProtectedRoute>
              } />

              <Route path="/saifi" element={
                <ProtectedRoute>
                  <SaifiPage />
                </ProtectedRoute>
              } />

              <Route path="/gangguan" element={
                <ProtectedRoute>
                  <GangguanPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/rating-negatif" element={
                <ProtectedRoute>
                  <RatingNegatifPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/rating-negatif/input" element={
                <ProtectedRoute>
                  <InputRatingNegatifPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm" element={
                <ProtectedRoute>
                  <GangguanTmPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm/input" element={
                <ProtectedRoute>
                  <InputGangguanTmPage />
                </ProtectedRoute>
              } />

              {/* Phase 2 Placeholders */}
              <Route path="/nko" element={
                <ProtectedRoute>
                  <NkoPage />
                </ProtectedRoute>
              } />
              <Route path="/ens" element={
                <ProtectedRoute>
                  <EnsPage />
                </ProtectedRoute>
              } />
              <Route path="/pelanggan" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Data Pelanggan" />
                </ProtectedRoute>
              } />
              <Route path="/daya-sambung" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Daya Sambung" />
                </ProtectedRoute>
              } />
              <Route path="/penjualan" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Penjualan TL" />
                </ProtectedRoute>
              } />
              <Route path="/pendapatan" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Pendapatan Daerah" />
                </ProtectedRoute>
              } />
              <Route path="/susut" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Susut Jaringan" />
                </ProtectedRoute>
              } />
              <Route path="/p2tl" element={
                <ProtectedRoute>
                  <PlaceholderPage title="P2TL Penertiban" />
                </ProtectedRoute>
              } />
              <Route path="/ganti-meter" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Ganti Meter Kwh" />
                </ProtectedRoute>
              } />
              <Route path="/niaga" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Teknik &amp; Niaga" />
                </ProtectedRoute>
              } />
              <Route path="/skki" element={
                <ProtectedRoute>
                  <PlaceholderPage title="SKKI / Pengadaan" />
                </ProtectedRoute>
              } />
              <Route path="/management" element={
                <ProtectedRoute>
                  <PlaceholderPage title="Struktur Manajemen" />
                </ProtectedRoute>
              } />

              {/* Legacy Routes Redirect */}
              <Route path="/gangguan-tm" element={<Navigate to="/jaringan/gangguan-tm" replace />} />
              <Route path="/gangguan-switching" element={<Navigate to="/jaringan/gangguan-tm" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
