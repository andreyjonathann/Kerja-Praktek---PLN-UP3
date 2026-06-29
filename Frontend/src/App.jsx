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
import SpreadsheetDemo from '@/pages/SpreadsheetDemo'
import InputKinerjaPage from '@/pages/InputKinerja'
import KelolaTargetPage from '@/pages/KelolaTarget'
import KelolaJaringanPage from '@/pages/KelolaJaringan'

// Pemasaran Pages (legacy)
import OverviewPemasaranPage from '@/pages/Pemasaran/OverviewPemasaran'
import JumlahPelangganPage from '@/pages/Pemasaran/JumlahPelanggan'
import DayaTersambungPage from '@/pages/Pemasaran/DayaTersambung'
import PenjualanTLPage from '@/pages/Pemasaran/PenjualanTL'
import PendapatanTLPage from '@/pages/Pemasaran/PendapatanTL'
import DataPerTarifPage from '@/pages/Pemasaran/DataPerTarif'

// Pemasaran Pages v2 (role-based, pola sama dengan Jaringan)
import InputKinerjaPermasaranPage from '@/pages/Pemasaran/v2/InputKinerjaPermasaran'
import PenjualanPage     from '@/pages/Pemasaran/v2/Penjualan'
import PelangganPage     from '@/pages/Pemasaran/v2/Pelanggan'
import DayaTersambungV2Page  from '@/pages/Pemasaran/v2/DayaTersambung'
import PendapatanBPPage  from '@/pages/Pemasaran/v2/PendapatanBP'
import PlnMobilePage     from '@/pages/Pemasaran/v2/PlnMobile'


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

// Role-based home: pic_pemasaran → /pemasaran, lainnya → Overview biasa
function RoleBasedHome() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'pic_pemasaran') {
    return <Navigate to="/pemasaran" replace />
  }
  return (
    <ProtectedRoute>
      <OverviewPage />
    </ProtectedRoute>
  )
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
              <Route path="/" element={<RoleBasedHome />} />

              {/* Halaman Overview khusus PIC Pemasaran */}
              <Route path="/pemasaran" element={
                <ProtectedRoute>
                  <OverviewPemasaranPage />
                </ProtectedRoute>
              } />

              {/* ── Routes Pemasaran v2 (pola sama dengan Jaringan) ── */}
              <Route path="/pemasaran/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage />
                </ProtectedRoute>
              } />
              <Route path="/pemasaran/penjualan" element={
                <ProtectedRoute>
                  <PenjualanPage />
                </ProtectedRoute>
              } />
              <Route path="/pemasaran/pelanggan" element={
                <ProtectedRoute>
                  <PelangganPage />
                </ProtectedRoute>
              } />
              <Route path="/pemasaran/daya" element={
                <ProtectedRoute>
                  <DayaTersambungV2Page />
                </ProtectedRoute>
              } />
              <Route path="/pemasaran/pendapatan-bp" element={
                <ProtectedRoute>
                  <PendapatanBPPage />
                </ProtectedRoute>
              } />
              <Route path="/pemasaran/pln-mobile" element={
                <ProtectedRoute>
                  <PlnMobilePage />
                </ProtectedRoute>
              } />

              <Route path="/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage />
                </ProtectedRoute>
              } />

              <Route path="/kelola-target" element={
                <ProtectedRoute>
                  <KelolaTargetPage />
                </ProtectedRoute>
              } />

              <Route path="/kelola-jaringan" element={
                <ProtectedRoute>
                  <KelolaJaringanPage />
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

              <Route path="/spreadsheet" element={
                <ProtectedRoute>
                  <SpreadsheetDemo />
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
              {/* Pemasaran Routes */}
              <Route path="/jml-pelanggan" element={
                <ProtectedRoute>
                  <JumlahPelangganPage />
                </ProtectedRoute>
              } />
              <Route path="/daya-tersambung" element={
                <ProtectedRoute>
                  <DayaTersambungPage />
                </ProtectedRoute>
              } />
              <Route path="/penjualan-tl" element={
                <ProtectedRoute>
                  <PenjualanTLPage />
                </ProtectedRoute>
              } />
              <Route path="/pendapatan-tl" element={
                <ProtectedRoute>
                  <PendapatanTLPage />
                </ProtectedRoute>
              } />
              <Route path="/data-tarif" element={
                <ProtectedRoute>
                  <DataPerTarifPage />
                </ProtectedRoute>
              } />
              {/* Legacy Aliases */}
              <Route path="/pelanggan" element={<ProtectedRoute><JumlahPelangganPage /></ProtectedRoute>} />
              <Route path="/daya-sambung" element={<ProtectedRoute><DayaTersambungPage /></ProtectedRoute>} />
              <Route path="/penjualan" element={<ProtectedRoute><PenjualanTLPage /></ProtectedRoute>} />
              <Route path="/pendapatan" element={<ProtectedRoute><PendapatanTLPage /></ProtectedRoute>} />
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
