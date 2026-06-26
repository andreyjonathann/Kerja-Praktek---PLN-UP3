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
import EnsPage from '@/pages/Ens'
import NkoPage from '@/pages/Nko'
import PlaceholderPage from '@/pages/Placeholder'
import InputKinerjaPage from '@/pages/InputKinerja'
import InputSaifiPage from '@/pages/InputSaifi'
import RatingNegatifPage from '@/pages/RatingNegatif'
import InputRatingNegatifPage from '@/pages/InputRatingNegatif'
import GangguanTmPage from '@/pages/GangguanTm'
import InputGangguanTmPage from '@/pages/InputGangguanTm'
import GangguanSwitchingPage from '@/pages/GangguanSwitching'
import InputGangguanSwitchingPage from '@/pages/InputGangguanSwitching'
import TargetGangguanSwitchingPage from '@/pages/TargetGangguanSwitching'
import RptGangguanPage from '@/pages/RptGangguan'
import InputRptGangguanPage from '@/pages/InputRptGangguan'
import SrdagPage from '@/pages/Srdag'
import InputSrdagPage from '@/pages/InputSrdag'
import TargetSrdagPage from '@/pages/TargetSrdag'
import MvodPage from '@/pages/Mvod'
import InputMvodPage from '@/pages/InputMvod'
import TargetMvodPage from '@/pages/TargetMvod'
import MttrPage from '@/pages/Mttr'
import InputMttrPage from '@/pages/InputMttr'
import TargetMttrPage from '@/pages/TargetMttr'

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

              <Route path="/jaringan/gangguan-switching" element={
                <ProtectedRoute>
                  <GangguanSwitchingPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-gangguan-switching" element={
                <ProtectedRoute>
                  <InputGangguanSwitchingPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/rpt-gangguan" element={
                <ProtectedRoute>
                  <RptGangguanPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-rpt-gangguan" element={
                <ProtectedRoute>
                  <InputRptGangguanPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-switching/target" element={
                <ProtectedRoute>
                  <TargetGangguanSwitchingPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/srdag" element={
                <ProtectedRoute>
                  <SrdagPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-srdag" element={
                <ProtectedRoute>
                  <InputSrdagPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/srdag/target" element={
                <ProtectedRoute>
                  <TargetSrdagPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/mvod" element={
                <ProtectedRoute>
                  <MvodPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-mvod" element={
                <ProtectedRoute>
                  <InputMvodPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/mvod/target" element={
                <ProtectedRoute>
                  <TargetMvodPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/mttr-siaga1" element={
                <ProtectedRoute>
                  <MttrPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-mttr" element={
                <ProtectedRoute>
                  <InputMttrPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/mttr-siaga1/target" element={
                <ProtectedRoute>
                  <TargetMttrPage />
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
