import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { FilterProvider, useFilter } from '@/context/FilterContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Layout from '@/components/layout/Layout'

// Pages
import LoginPage from '@/pages/Login'
import OverviewPage from '@/pages/Overview'
import SaidiPage from '@/pages/Saidi'
import SaifiPage from '@/pages/Saifi'
import EnsPage from '@/pages/Ens'
import NkoPage from '@/pages/Nko'
import TrendNkoPage from '@/pages/TrendNko'
import PlaceholderPage from '@/pages/Placeholder'
import InputKinerjaSaidiPage from '@/pages/InputKinerjaSaidi'
import InputSaifiPage from '@/pages/InputSaifi'
import InputEnsPage from '@/pages/InputEns'
import RatingNegatifPage from '@/pages/RatingNegatif'
import InputRatingNegatifPage from '@/pages/InputRatingNegatif'
import GangguanTmPage from '@/pages/GangguanTm'
import InputGangguanTmPage from '@/pages/InputGangguanTm'
import InputGangguanTmKurang5Page from '@/pages/InputGangguanTmKurang5'
import InputGangguanTmLebih5Page from '@/pages/InputGangguanTmLebih5'
import EditGangguanTmLebih5Page from '@/pages/EditGangguanTmLebih5'

import GangguanSwitchingPage from '@/pages/GangguanSwitching'
import InputGangguanSwitchingPage from '@/pages/InputGangguanSwitching'
import InputGangguanTrafoPage from '@/pages/InputGangguanTrafo'
import EditGangguanSwitchingPage from '@/pages/EditGangguanSwitching'
import EditGangguanTrafoPage from '@/pages/EditGangguanTrafo'
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
import InputKinerjaPelunasanPage from '@/pages/Niaga/InputKinerjaPelunasan'
import PenghapusanPrrPage from '@/pages/Niaga/PenghapusanPrr'
import InputKinerjaPenghapusanPage from '@/pages/Niaga/InputKinerjaPenghapusan'
import TindakLanjutLbkbPage from '@/pages/Niaga/TindakLanjutLbkb'
import InputKinerjaLbkbPage from '@/pages/Niaga/InputKinerjaLbkb'
import SaldoAkhirPage from '@/pages/Niaga/SaldoAkhir'
import InputKinerjaSaldoAkhirPage from '@/pages/Niaga/InputKinerjaSaldoAkhir'

// Pemasaran Pages (legacy)
import JumlahPelangganPage from '@/pages/Pemasaran/JumlahPelanggan'
import DayaTersambungPage from '@/pages/Pemasaran/DayaTersambung'
import PenjualanTLPage from '@/pages/Pemasaran/PenjualanTL'
import PendapatanTLPage from '@/pages/Pemasaran/PendapatanTL'
import DataPerTarifPage from '@/pages/Pemasaran/DataPerTarif'

// Pemasaran Pages v2 (role-based, pola sama dengan Jaringan)
import InputKinerjaPemasaranPage from '@/pages/Pemasaran/v2/InputKinerjaPemasaran'
import PenjualanPage     from '@/pages/Pemasaran/v2/Penjualan'
import PelangganPage     from '@/pages/Pemasaran/v2/Pelanggan'
import DayaTersambungV2Page  from '@/pages/Pemasaran/v2/DayaTersambung'
import PendapatanBPPage  from '@/pages/Pemasaran/v2/PendapatanBP'
import PlnMobilePage     from '@/pages/Pemasaran/v2/PlnMobile'
import EditKinerjaPermasaranPage from '@/pages/Pemasaran/v2/EditKinerjaPermasaranPage'
import EditKinerjaPage from '@/pages/EditKinerja'
import EditEnsPage from '@/pages/EditEns'

// Transaksi Energi Pages
import SusutDistribusiPage from '@/pages/SusutDistribusiPage'
import InputKinerjaSusutDistribusiPage from '@/pages/InputKinerjaSusutDistribusi'
import EditKinerjaSusutDistribusiPage from '@/pages/EditKinerjaSusutDistribusi'
import P2tlPage from '@/pages/P2tl'
import InputKinerjaP2tlPage from '@/pages/InputKinerjaP2tl'
import EditKinerjaP2tlPage from '@/pages/EditKinerjaP2tl'
import GantiMeterPage from '@/pages/GantiMeter'
import InputKinerjaGantiMeterPage from '@/pages/InputKinerjaGantiMeter'
import EditKinerjaGantiMeterPage from '@/pages/EditKinerjaGantiMeter'

// Admin Pages
import KelolaTargetPage from '@/pages/Admin/KelolaTarget'
import KelolaTargetBulananPage from '@/pages/Admin/KelolaTargetBulanan'

// Pengadaan Pages
import PengadaanKontrakPage from '@/pages/Pengadaan/Kontrak'
import KelolaPaguAnggaranPage from '@/pages/Pengadaan/KelolaPaguAnggaran'
import InputPengadaanPage from '@/pages/Pengadaan/InputPengadaan'
import UbahStatusPengadaanPage from '@/pages/Pengadaan/UbahStatusPengadaan'

// Keuangan Pages
import DashboardKeuanganPage from '@/pages/Keuangan/DashboardKeuangan'
import InputPaguPage from '@/pages/Keuangan/InputPaguPage'
import KontrakDetailPage from '@/pages/Keuangan/KontrakDetailPage'

// K3 Pages
import K3DashboardPage         from '@/pages/K3/Dashboard'

import K3SelfAssessmentPage    from '@/pages/K3/SelfAssessment'
import K3LmcPage               from '@/pages/K3/Lmc'
import AssessmentInputPage     from '@/pages/K3/AssessmentInput'
import K3SelfAssessmentDetailPage from '@/pages/K3/SelfAssessment/Detail'
import K3KegiatanPage          from '@/pages/K3/Kegiatan'
import K3TemuanPage from '@/pages/K3/Temuan'
import K3NkoPage from '@/pages/K3/Nko'
import K3ApprovalPage from '@/pages/K3/Approval'
import K3LaporanPage from '@/pages/K3/Laporan'
import K3ManajemenPage from '@/pages/K3/Manajemen'
import K3DokumenPage from '@/pages/K3/Dokumen'
import K3NotifikasiPage from '@/pages/K3/Notifikasi'

// Error Boundary
import ErrorBoundary from '@/components/ui/ErrorBoundary'

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

// Input Protected Route Wrapper: Redirect Perencanaan role to home
function InputProtectedRoute({ children }) {
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

  if (user.role === 'perencanaan' || user.role === 'manager') {
    return <Navigate to="/" replace />
  }

  return <Layout>{children}</Layout>
}

// Pengadaan Write Protected Route Wrapper: Redirect anyone except pic_pengadaan back to /pengadaan/kontrak
function PengadaanProtectedRoute({ children }) {
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

  if (user.role !== 'pic_pengadaan') {
    return <Navigate to="/pengadaan/kontrak" replace />
  }

  return <Layout>{children}</Layout>
}

// Role-based home redirects
function RoleBasedHome() {
  const { user, loading } = useAuth()
  if (loading) return null

  if (user?.role === 'pic_pengadaan') {
    return <Navigate to="/pengadaan/kontrak" replace />
  }
  if (user?.role === 'pic_pemasaran') {
    return <Navigate to="/pemasaran" replace />
  }
  if (user?.role === 'pic_transaksi_energi') {
    return <Navigate to="/susut" replace />
  }
  if (user?.role === 'pic_niaga') {
    return <Navigate to="/niaga/pelunasan" replace />
  }
  if (user?.role === 'pic_jaringan') {
    return <Navigate to="/saidi" replace />
  }
  if (user?.role === 'pic_k3') {
    return <Navigate to="/k3/dashboard" replace />
  }
  if (user?.role === 'pic_keuangan') {
    return <Navigate to="/keuangan" replace />
  }
  return (
    <ProtectedRoute>
      <OverviewPage />
    </ProtectedRoute>
  )
}

// Reset filter periode (year/month) ke bulan berjalan setiap kali 
// user berpindah halaman, agar user tidak "terjebak" di bulan lama 
// saat kembali membuka halaman yang sama di lain waktu.
function PeriodResetOnNavigate() {
  const location = useLocation()
  const { resetPeriodToCurrent } = useFilter()

  useEffect(() => {
    resetPeriodToCurrent()
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <BrowserRouter>
            <PeriodResetOnNavigate />
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected dashboard routes */}
              <Route path="/" element={<RoleBasedHome />} />

              {/* Halaman Overview khusus PIC Pemasaran - di-redirect ke penjualan */}
              <Route path="/pemasaran" element={
                <ProtectedRoute>
                  <Navigate to="/pemasaran/penjualan" replace />
                </ProtectedRoute>
              } />

              {/* ── Routes Pemasaran v2 (pola sama dengan Jaringan) ── */}
              <Route path="/pemasaran/input" element={
                <InputProtectedRoute>
                  <InputKinerjaPemasaranPage />
                </InputProtectedRoute>
              } />
              <Route path="/pemasaran/edit/:type/:bulan/:tahun" element={
                <InputProtectedRoute>
                  <EditKinerjaPermasaranPage />
                </InputProtectedRoute>
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


              <Route path="/input" element={<Navigate to="/" replace />} />

              <Route path="/saidi/input" element={
                <InputProtectedRoute>
                  <InputKinerjaSaidiPage />
                </InputProtectedRoute>
              } />

              <Route path="/saifi/input" element={
                <InputProtectedRoute>
                  <InputSaifiPage />
                </InputProtectedRoute>
              } />

              <Route path="/kelola-target" element={
                <InputProtectedRoute>
                  <KelolaTargetPage />
                </InputProtectedRoute>
              } />
              
              <Route path="/kelola-target/:bidang/:indikator" element={
                <InputProtectedRoute>
                  <KelolaTargetBulananPage />
                </InputProtectedRoute>
              } />

              <Route path="/:type/edit/:bulan/:tahun" element={
                <InputProtectedRoute>
                  <EditKinerjaPage />
                </InputProtectedRoute>
              } />
              <Route path="/ens/edit/:bulan/:tahun" element={
                <InputProtectedRoute>
                  <EditEnsPage />
                </InputProtectedRoute>
              } />

              <Route path="/ens/input" element={
                <InputProtectedRoute>
                  <InputEnsPage />
                </InputProtectedRoute>
              } />



              <Route path="/saidi" element={
                <ProtectedRoute>
                  <SaidiPage />
                </ProtectedRoute>
              } />

              {/* Pengadaan Routes */}
              <Route path="/pengadaan" element={<Navigate to="/pengadaan/kontrak" replace />} />
              <Route path="/pengadaan/kontrak" element={
                <ProtectedRoute>
                  <PengadaanKontrakPage />
                </ProtectedRoute>
              } />
              <Route path="/pengadaan/kelola-pagu" element={
                <ProtectedRoute>
                  <KelolaPaguAnggaranPage />
                </ProtectedRoute>
              } />
              <Route path="/pengadaan/pagu" element={
                <ProtectedRoute>
                  <KelolaPaguAnggaranPage />
                </ProtectedRoute>
              } />
              <Route path="/pengadaan/input" element={
                <PengadaanProtectedRoute>
                  <InputPengadaanPage />
                </PengadaanProtectedRoute>
              } />
              <Route path="/pengadaan/edit/:id" element={
                <PengadaanProtectedRoute>
                  <InputPengadaanPage />
                </PengadaanProtectedRoute>
              } />
              <Route path="/pengadaan/ubah-status" element={
                <ProtectedRoute>
                  <UbahStatusPengadaanPage />
                </ProtectedRoute>
              } />
              <Route path="/pengadaan/status/:id" element={
                <PengadaanProtectedRoute>
                  <UbahStatusPengadaanPage />
                </PengadaanProtectedRoute>
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
                <InputProtectedRoute>
                  <InputRatingNegatifPage />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm" element={
                <ProtectedRoute>
                  <GangguanTmPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm/input" element={
                <ProtectedRoute>
                  <Navigate to="/jaringan/gangguan-tm" replace />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm/input-kurang-5-menit" element={
                <InputProtectedRoute>
                  <InputGangguanTmKurang5Page />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm/input-lebih-5-menit" element={
                <InputProtectedRoute>
                  <InputGangguanTmLebih5Page />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/gangguan-tm/edit-lebih-5-menit" element={
                <ProtectedRoute>
                  <EditGangguanTmLebih5Page />
                </ProtectedRoute>
              } />


              <Route path="/jaringan/gangguan-switching" element={
                <ProtectedRoute>
                  <GangguanSwitchingPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-gangguan-switching" element={
                <InputProtectedRoute>
                  <InputGangguanSwitchingPage />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/edit-gangguan-switching" element={
                <ProtectedRoute>
                  <EditGangguanSwitchingPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-gangguan-trafo" element={
                <InputProtectedRoute>
                  <InputGangguanTrafoPage />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/edit-gangguan-trafo" element={
                <ProtectedRoute>
                  <EditGangguanTrafoPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/rpt-gangguan" element={
                <ProtectedRoute>
                  <RptGangguanPage />
                </ProtectedRoute>
              } />

              <Route path="/jaringan/input-rpt-gangguan" element={
                <InputProtectedRoute>
                  <InputRptGangguanPage />
                </InputProtectedRoute>
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

              <Route path="/jaringan/srdag/input" element={
                <InputProtectedRoute>
                  <InputSrdagPage />
                </InputProtectedRoute>
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

              <Route path="/jaringan/mvod/input" element={
                <InputProtectedRoute>
                  <InputMvodPage />
                </InputProtectedRoute>
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

              <Route path="/jaringan/mttr-siaga1/input" element={
                <InputProtectedRoute>
                  <InputMttrPage />
                </InputProtectedRoute>
              } />

              <Route path="/jaringan/mttr-siaga1/target" element={
                <ProtectedRoute>
                  <TargetMttrPage />
                </ProtectedRoute>
              } />

              {/* Phase 2 Placeholders */}
              <Route path="/nko" element={
                <InputProtectedRoute>
                  <NkoPage />
                </InputProtectedRoute>
              } />
              <Route path="/trend-nko" element={
                <InputProtectedRoute>
                  <TrendNkoPage />
                </InputProtectedRoute>
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
              {/* Transaksi Energi Routes (branch Eunike) */}
              <Route path="/susut" element={
                <ProtectedRoute>
                  <SusutDistribusiPage />
                </ProtectedRoute>
              } />
              <Route path="/susut/input" element={
                <InputProtectedRoute>
                  <InputKinerjaSusutDistribusiPage />
                </InputProtectedRoute>
              } />
              <Route path="/susut/edit/:bulan/:tahun" element={
                <InputProtectedRoute>
                  <EditKinerjaSusutDistribusiPage />
                </InputProtectedRoute>
              } />
              <Route path="/p2tl" element={
                <ProtectedRoute>
                  <P2tlPage />
                </ProtectedRoute>
              } />
              <Route path="/p2tl/input" element={
                <InputProtectedRoute>
                  <InputKinerjaP2tlPage />
                </InputProtectedRoute>
              } />
              <Route path="/p2tl/edit/:id" element={
                <InputProtectedRoute>
                  <EditKinerjaP2tlPage />
                </InputProtectedRoute>
              } />
              <Route path="/ganti-meter" element={
                <ProtectedRoute>
                  <GantiMeterPage />
                </ProtectedRoute>
              } />
              <Route path="/ganti-meter/input" element={
                <InputProtectedRoute>
                  <InputKinerjaGantiMeterPage />
                </InputProtectedRoute>
              } />
              <Route path="/ganti-meter/edit/:id" element={
                <InputProtectedRoute>
                  <EditKinerjaGantiMeterPage />
                </InputProtectedRoute>
              } />
              <Route path="/niaga" element={<Navigate to="/niaga/pelunasan" replace />} />
              <Route path="/niaga/pelunasan" element={
                <ProtectedRoute>
                  <PelunasanPrrPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/pelunasan/input" element={
                <InputProtectedRoute>
                  <InputKinerjaPelunasanPage />
                </InputProtectedRoute>
              } />
              <Route path="/niaga/penghapusan" element={
                <ProtectedRoute>
                  <PenghapusanPrrPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/penghapusan/input" element={
                <InputProtectedRoute>
                  <InputKinerjaPenghapusanPage />
                </InputProtectedRoute>
              } />
              <Route path="/niaga/saldo-akhir" element={
                <ProtectedRoute>
                  <SaldoAkhirPage />
                </ProtectedRoute>
              } />
              <Route path="/niaga/saldo-akhir/input" element={
                <InputProtectedRoute>
                  <InputKinerjaSaldoAkhirPage />
                </InputProtectedRoute>
              } />

              {/* K3 Routes */}
              <Route path="/k3/dashboard" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3DashboardPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />

              <Route path="/k3/assessment/lmc" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3LmcPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/k3/assessment/:category/input" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AssessmentInputPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/k3/assessment/:category" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3SelfAssessmentPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />

              <Route path="/k3/kegiatan" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3KegiatanPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/k3/temuan" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3TemuanPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/k3/nko" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <K3NkoPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />


              {/* ── Keuangan Routes ─────────────────────────────────── */}
              <Route path="/keuangan" element={
                <ProtectedRoute>
                  <DashboardKeuanganPage />
                </ProtectedRoute>
              } />
              <Route path="/keuangan/input-pagu" element={
                <ProtectedRoute>
                  <InputPaguPage />
                </ProtectedRoute>
              } />
              <Route path="/keuangan/contract/:id" element={
                <ProtectedRoute>
                  <KontrakDetailPage />
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

              {/* ── K3 Maturity Level Routes ─────────────────────────── */}
              <Route path="/k3/dashboard" element={
                <ProtectedRoute>
                  <K3DashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/k3/assessment/:category" element={
                <ProtectedRoute>
                  <K3SelfAssessmentPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/assessment/:category/:criteriaId" element={
                <ProtectedRoute>
                  <K3SelfAssessmentDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/approval" element={
                <ProtectedRoute>
                  <K3ApprovalPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/temuan" element={
                <ProtectedRoute>
                  <K3TemuanPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/kegiatan" element={
                <ProtectedRoute>
                  <K3KegiatanPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/laporan" element={
                <ProtectedRoute>
                  <K3LaporanPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/manajemen" element={
                <ProtectedRoute>
                  <K3ManajemenPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/dokumen" element={
                <ProtectedRoute>
                  <K3DokumenPage />
                </ProtectedRoute>
              } />
              <Route path="/k3/notifikasi" element={
                <ProtectedRoute>
                  <K3NotifikasiPage />
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
