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
import InputEnsPage from '@/pages/InputEns'
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
import PelunasanPrrPage from '@/pages/Niaga/PelunasanPrr'
import PenghapusanPrrPage from '@/pages/Niaga/PenghapusanPrr'
import TindakLanjutLbkbPage from '@/pages/Niaga/TindakLanjutLbkb'

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
import EditKinerjaPage from '@/pages/EditKinerja'

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

              <Route path="/saidi/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage />
                </ProtectedRoute>
              } />

              <Route path="/saifi/input" element={
                <ProtectedRoute>
                  <InputSaifiPage />
                </ProtectedRoute>
              } />

              <Route path="/:type/edit/:bulan/:tahun" element={
                <ProtectedRoute>
                  <EditKinerjaPage />
                </ProtectedRoute>
              } />
              <Route path="/ens/input" element={
                <ProtectedRoute>
                  <InputEnsPage />
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
              <Route path="/niaga" element={<Navigate to="/niaga/pelunasan" replace />} />
              <Route path="/niaga/pelunasan" element={
                <ProtectedRoute>
                  <PelunasanPrrPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/pelunasan/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage kpiFilter="pelunasan" />
                </ProtectedRoute>
              } />
              <Route path="/niaga/penghapusan" element={
                <ProtectedRoute>
                  <PenghapusanPrrPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/penghapusan/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage kpiFilter="penghapusan" />
                </ProtectedRoute>
              } />
              <Route path="/niaga/lbkb" element={
                <ProtectedRoute>
                  <TindakLanjutLbkbPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/lbkb/input" element={
                <ProtectedRoute>
                  <InputKinerjaPage kpiFilter="lbkb" />
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
