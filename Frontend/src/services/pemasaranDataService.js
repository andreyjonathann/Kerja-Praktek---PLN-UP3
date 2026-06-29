/**
 * pemasaranDataService.js
 * Reactive store untuk data KPI Pemasaran terintegrasi dengan database.
 * - Target: dinamis dari /targets, jika kosong/error fallback ke built-in
 * - Realisasi: disimpan ke /kinerja/pemasaran, fallback ke localStorage
 */
import api from './api';

// ─── Konstanta ───────────────────────────────────────────────────────────────
export const TARIF_KEYS   = ['s','r','b','i','p','t','l','c']
export const TARIF_LABELS = { s:'S - Sosial', r:'R - Rumah Tangga', b:'B - Bisnis', i:'I - Industri', p:'P - Pemerintah', t:'T - Traksi', l:'L - Layanan Khusus', c:'C - Curah' }

const MONTHS_SHORT = { 1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'Mei',6:'Jun', 7:'Jul',8:'Ags',9:'Sep',10:'Okt',11:'Nov',12:'Des' }

// Target tahunan 2026 per golongan tarif (nilai acuan realistis UP3 Kebon Jeruk)
const ANNUAL_TARGET_2026 = {
  penjualan_kwh: { s:320000, r:2100000, b:1350000, i:3800000, p:450000, t:52000, l:110000, c:78000 },
  jumlah_pelanggan: { s:6800, r:51000, b:7800, i:1450, p:1100, t:95, l:520, c:260 },
  daya_va:       { s:22000, r:305000, b:218000, i:1020000, p:114000, t:26000, l:45000, c:34000 },
  pendapatan_rp: { total: 24500 }, // juta Rp
  pln_mobile:    { pengguna_target: 342000, transaksi_target: 1704000, nilai_target: 105000 }, // juta Rp
}

// Target per bulan (dibagi rata, sedikit weighted ke Q3/Q4)
const MONTH_WEIGHTS = [0.077,0.074,0.082,0.080,0.083,0.081,0.086,0.088,0.085,0.084,0.083,0.077]

// Fetch targets from backend and scale them dynamically based on Google Sheet targets
export async function getMonthlyTarget(year, month) {
  const w = MONTH_WEIGHTS[month - 1];
  const yearScale = year === 2026 ? 1 : year === 2025 ? 0.97 : year === 2027 ? 1.03 : 1;

  let dbPenjualanTgt = 59.0;
  let dbPelangganTgt = 10158.0;
  let dbDayaTgt = 43.73;
  let dbPendapatanTgt = 24.5;
  let dbMobileTrxTgt = 1704000;
  let dbMobileNilaiTgt = 105;

  try {
    const targetsRes = await api.get(`/targets?tahun=${year}`);
    const dbTargets = targetsRes.data || [];
    
    const pen = dbTargets.find(t => t.indikator === 'Penjualan TL');
    if (pen) dbPenjualanTgt = parseFloat(pen.target);

    const pel = dbTargets.find(t => t.indikator === 'Jumlah Pelanggan');
    if (pel) dbPelangganTgt = parseFloat(pel.target);

    const day = dbTargets.find(t => t.indikator === 'Daya Tersambung');
    if (day) dbDayaTgt = parseFloat(day.target);

    const penBp = dbTargets.find(t => t.indikator === 'Pendapatan BP');
    if (penBp) dbPendapatanTgt = parseFloat(penBp.target);

    const mobTr = dbTargets.find(t => t.indikator === 'PLN Mobile Transaksi');
    if (mobTr) dbMobileTrxTgt = parseFloat(mobTr.target);

    const mobNi = dbTargets.find(t => t.indikator === 'PLN Mobile Nilai');
    if (mobNi) dbMobileNilaiTgt = parseFloat(mobNi.target);
  } catch (e) {
    console.warn("Failed to fetch targets from backend, using default mapping", e);
  }

  // Convert targets to form units
  // Penjualan: GWh -> kWh (1 GWh = 1,000,000 kWh)
  const annualPenjualanKwh = dbPenjualanTgt * 1000000;
  const annualPelanggan = dbPelangganTgt;
  // Daya: MVA -> VA (1 MVA = 1,000,000 VA)
  const annualDayaVa = dbDayaTgt * 1000000;
  // Pendapatan: Rp Miliar -> Juta Rp (1 Miliar = 1,000 Juta)
  const annualPendapatanJuta = dbPendapatanTgt * 1000;
  const annualMobileTrx = dbMobileTrxTgt;
  const annualMobileNilaiJuta = dbMobileNilaiTgt * 1000;

  // Sum of hardcoded targets
  const hardcodedPenjualanSum = TARIF_KEYS.reduce((s, k) => s + ANNUAL_TARGET_2026.penjualan_kwh[k], 0);
  const hardcodedPelangganSum = TARIF_KEYS.reduce((s, k) => s + ANNUAL_TARGET_2026.jumlah_pelanggan[k], 0);
  const hardcodedDayaSum = TARIF_KEYS.reduce((s, k) => s + ANNUAL_TARGET_2026.daya_va[k], 0);

  const monthlyPenj = annualPenjualanKwh * w;
  const monthlyPelg = annualPelanggan * w;
  const monthlyDaya = annualDayaVa * w;
  const monthlyPend = annualPendapatanJuta * w;
  const monthlyMobileTrx = annualMobileTrx * w;
  const monthlyMobileNilai = annualMobileNilaiJuta * w;

  return {
    // Penjualan kWh per tarif
    penjualan_kwh: Object.fromEntries(
      TARIF_KEYS.map(k => [k, Math.round(monthlyPenj * (ANNUAL_TARGET_2026.penjualan_kwh[k] / hardcodedPenjualanSum))])
    ),
    // Jumlah pelanggan baru per tarif
    jumlah_pelanggan: Object.fromEntries(
      TARIF_KEYS.map(k => [k, Math.round(monthlyPelg * (ANNUAL_TARGET_2026.jumlah_pelanggan[k] / hardcodedPelangganSum))])
    ),
    // Daya tersambung (VA) per tarif
    daya_va: Object.fromEntries(
      TARIF_KEYS.map(k => [k, Math.round(monthlyDaya * (ANNUAL_TARGET_2026.daya_va[k] / hardcodedDayaSum))])
    ),
    // Pendapatan BP
    pendapatan_rp: Math.round(monthlyPend),
    // PLN Mobile
    pln_mobile_pengguna_target: Math.round(ANNUAL_TARGET_2026.pln_mobile.pengguna_target * w * yearScale),
    pln_mobile_transaksi_target: Math.round(monthlyMobileTrx),
    pln_mobile_nilai_target: Math.round(monthlyMobileNilai),
  }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = (year, month) => `sigap_pemasaran_${year}_${String(month).padStart(2,'0')}`

export async function saveRealisasi(year, month, realisasi) {
  try {
    // Sync to local storage first as a mirror
    localStorage.setItem(LS_KEY(year, month), JSON.stringify({ ...realisasi, _savedAt: Date.now() }))

    // Calculate totals for backend NKO generic mapping
    const totalPenjualan = TARIF_KEYS.reduce((s, k) => s + (Number(realisasi[`penjualan_kwh_${k}`]) || 0), 0);
    const totalPelanggan = TARIF_KEYS.reduce((s, k) => s + (Number(realisasi[`pelanggan_${k}`]) || 0), 0);
    const totalDaya = TARIF_KEYS.reduce((s, k) => s + (Number(realisasi[`daya_va_${k}`]) || 0), 0);
    const totalPendapatan = (Number(realisasi.pendapatan_pb) || 0) + (Number(realisasi.pendapatan_td) || 0);

    const payload = {
      periode_id: month,
      tahun: year,
      ...realisasi,
      // Target matching fields scaled back to official DB units
      penjualan_tl: totalPenjualan / 1000000, // kWh -> GWh
      jumlah_pelanggan: totalPelanggan,
      daya_tersambung: totalDaya / 1000000, // VA -> MVA
      pendapatan_bp: totalPendapatan / 1000, // Juta Rp -> Rp Miliar
      pln_mobile_transaksi: Number(realisasi.mobile_transaksi) || 0,
      pln_mobile_nilai: (Number(realisasi.mobile_nilai) || 0) / 1000 // Juta Rp -> Rp Miliar
    };

    await api.post('/kinerja/pemasaran', payload);
    window.dispatchEvent(new CustomEvent('pemasaran:dataUpdated', { detail: { year, month } }))
    return true
  } catch (e) {
    console.error('Failed to save realisasi:', e)
    throw e;
  }
}

export async function getRealisasi(year, month) {
  try {
    const res = await api.get(`/kinerja/pemasaran?tahun=${year}&periode_id=${month}`);
    if (res.data && res.data.length > 0) {
      // Find the one that matches month
      const match = res.data.find(d => d.periode && parseInt(d.periode.bulan) === parseInt(month));
      if (match) {
        return isArrayOrObject(match.data_realisasi) 
          ? match.data_realisasi 
          : JSON.parse(match.data_realisasi);
      }
    }
  } catch (e) {
    console.warn("Failed to get realisasi from backend, falling back to local storage", e);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(LS_KEY(year, month))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function isArrayOrObject(val) {
  return val != null && (typeof val === 'object' || Array.isArray(val));
}

export async function getAllRealisasi(year) {
  const result = {}
  try {
    const res = await api.get(`/kinerja/pemasaran?tahun=${year}`);
    if (res.data && Array.isArray(res.data)) {
      res.data.forEach(item => {
        if (item.periode) {
          result[item.periode.bulan] = isArrayOrObject(item.data_realisasi)
            ? item.data_realisasi
            : JSON.parse(item.data_realisasi);
        }
      });
      return result;
    }
  } catch (e) {
    console.warn("Failed to fetch all realisations from backend, loading from local storage", e);
  }

  // Fallback to localStorage
  for (let m = 1; m <= 12; m++) {
    try {
      const raw = localStorage.getItem(LS_KEY(year, m))
      if (raw) result[m] = JSON.parse(raw);
    } catch {}
  }
  return result
}

// ─── Build 12-bulan data untuk chart/tabel ────────────────────────────────────
export async function getPemasaranData(year = 2026) {
  const allRealisasi = await getAllRealisasi(year)
  const rows = []

  for (let m = 1; m <= 12; m++) {
    const tgt = await getMonthlyTarget(year, m)
    const real = allRealisasi[m] || null

    const tgtPenjualanTotal   = TARIF_KEYS.reduce((s, k) => s + tgt.penjualan_kwh[k], 0)
    const tgtPelangganTotal   = TARIF_KEYS.reduce((s, k) => s + tgt.jumlah_pelanggan[k], 0)
    const tgtDayaTotal        = TARIF_KEYS.reduce((s, k) => s + tgt.daya_va[k], 0)
    const tgtPendapatan       = tgt.pendapatan_rp

    // Realisasi: dari database/localStorage atau null (belum diinput)
    const realPenjualanKwh    = real ? TARIF_KEYS.reduce((s, k) => s + (Number(real[`penjualan_kwh_${k}`]) || 0), 0) : null
    const realPenjualanTotal  = realPenjualanKwh
    const realPelangganTotal  = real ? TARIF_KEYS.reduce((s, k) => s + (Number(real[`pelanggan_${k}`]) || 0), 0) : null
    const realDayaTotal       = real ? TARIF_KEYS.reduce((s, k) => s + (Number(real[`daya_va_${k}`]) || 0) , 0) : null
    const realPendapatan      = real ? ((Number(real.pendapatan_pb) || 0) + (Number(real.pendapatan_td) || 0)) : null

    const row = {
      bulan: m,
      label: MONTHS_SHORT[m],

      // ── Penjualan ──
      penjualan_target: tgtPenjualanTotal,
      penjualan_total:  realPenjualanTotal,
      ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_target_${k}`, tgt.penjualan_kwh[k]])),
      ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_${k}`, real ? (Number(real[`penjualan_kwh_${k}`]) || 0) : null])),

      // ── Pelanggan ──
      pelanggan_target: tgtPelangganTotal,
      pelanggan_total:  realPelangganTotal,
      ...Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_target_${k}`, tgt.jumlah_pelanggan[k]])),
      ...Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`, real ? (Number(real[`pelanggan_${k}`]) || 0) : null])),

      // ── Daya ──
      daya_target: tgtDayaTotal,
      daya_total:  realDayaTotal,
      ...Object.fromEntries(TARIF_KEYS.map(k => [`daya_target_${k}`, tgt.daya_va[k]])),
      ...Object.fromEntries(TARIF_KEYS.map(k => [`daya_${k}`, real ? (Number(real[`daya_va_${k}`]) || 0) : null])),

      // ── Pendapatan ──
      pendapatan_target: tgtPendapatan,
      pendapatan_total:  realPendapatan,
      pendapatan_pb:     real ? (Number(real.pendapatan_pb) || 0) : null,
      pendapatan_td:     real ? (Number(real.pendapatan_td) || 0) : null,

      // ── PLN Mobile ──
      pln_mobile_transaksi_target: tgt.pln_mobile_transaksi_target,
      pln_mobile_nilai_target:     tgt.pln_mobile_nilai_target,
      pln_mobile_pengguna:         real ? (Number(real.mobile_pengguna) || 0)   : null,
      pln_mobile_transaksi:        real ? (Number(real.mobile_transaksi) || 0)  : null,
      pln_mobile_nilai:            real ? (Number(real.mobile_nilai) || 0)      : null,

      _hasData: !!real,
    }
    rows.push(row)
  }

  // Kumulatif
  let cumPenjReal = 0, cumPenjTgt = 0
  let cumPlgReal  = 0, cumPlgTgt  = 0
  let cumDayaReal = 0, cumDayaTgt = 0
  let cumPendReal = 0, cumPendTgt = 0
  let cumTrxReal  = 0, cumTrxTgt  = 0
  let cumNilaiReal= 0, cumNilaiTgt= 0

  rows.forEach(r => {
    cumPenjTgt  += r.penjualan_target;  if (r.penjualan_total  != null) cumPenjReal  += r.penjualan_total
    cumPlgTgt   += r.pelanggan_target;  if (r.pelanggan_total  != null) cumPlgReal   += r.pelanggan_total
    cumDayaTgt  += r.daya_target;       if (r.daya_total       != null) cumDayaReal  += r.daya_total
    cumPendTgt  += r.pendapatan_target; if (r.pendapatan_total != null) cumPendReal  += r.pendapatan_total
    cumTrxTgt   += r.pln_mobile_transaksi_target; if (r.pln_mobile_transaksi != null) cumTrxReal += r.pln_mobile_transaksi
    cumNilaiTgt += r.pln_mobile_nilai_target;     if (r.pln_mobile_nilai     != null) cumNilaiReal += r.pln_mobile_nilai

    r.c_penjualan_target = cumPenjTgt;  r.c_penjualan_total  = r.penjualan_total  != null ? cumPenjReal  : null
    r.c_pelanggan_target = cumPlgTgt;   r.c_pelanggan_total  = r.pelanggan_total  != null ? cumPlgReal   : null
    r.c_daya_target      = cumDayaTgt;  r.c_daya_total       = r.daya_total       != null ? cumDayaReal  : null
    r.c_pendapatan_target= cumPendTgt;  r.c_pendapatan_total = r.pendapatan_total != null ? cumPendReal  : null
    r.c_pln_mobile_transaksi_target = cumTrxTgt;  r.c_pln_mobile_transaksi = r.pln_mobile_transaksi != null ? cumTrxReal  : null
    r.c_pln_mobile_nilai_target     = cumNilaiTgt; r.c_pln_mobile_nilai    = r.pln_mobile_nilai     != null ? cumNilaiReal : null
  })

  // untuk programs gunakan target bulan terakhir
  const finalTgt = await getMonthlyTarget(year, 12);
  const tgtPelangganTotal = TARIF_KEYS.reduce((s,k) => s + finalTgt.jumlah_pelanggan[k], 0)

  const programs = [
    { nama: 'Pasang Baru Reguler',   keterangan: 'Seluruh ULP', bulan: Math.round(tgtPelangganTotal * 0.52) },
    { nama: 'Promo Daya Gratis',     keterangan: 'ULP Cengkareng & Kalideres', bulan: Math.round(tgtPelangganTotal * 0.13) },
    { nama: 'Kerjasama Developer',   keterangan: 'Perumahan baru Kalideres', bulan: Math.round(tgtPelangganTotal * 0.08) },
    { nama: 'Migrasi Go-PLN Mobile', keterangan: 'Sosialisasi pelanggan aktif', bulan: Math.round(tgtPelangganTotal * 0.27) },
  ]

  return { monthly: rows, programs, tarif_keys: TARIF_KEYS, tarif_labels: TARIF_LABELS }
}
