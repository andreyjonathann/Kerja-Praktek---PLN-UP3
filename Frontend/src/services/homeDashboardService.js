/**
 * homeDashboardService.js
 * Aggregates KPI data from ALL modules in parallel for the Executive Overview (Home) page.
 * Uses Promise.allSettled so one failing module does not break other modules.
 *
 * Returns:
 *   bidangCards  – Array of per-bidang card data (label, color, metrics, mainAch, path)
 *   allMetrics   – Flat array of all key metrics (used by KPI Scoreboard)
 *   attentionItems – Top-N metrics with the largest gap from target (Perlu Perhatian panel)
 */
import api from './api';
import { getDashboardData } from './dashboardDataService';
import { getNiagaData } from './niagaDataService';

const MONTH_WEIGHTS = [0.077, 0.074, 0.082, 0.080, 0.083, 0.081, 0.086, 0.088, 0.085, 0.084, 0.083, 0.077];

const getMonthlyDbTarget = (targetObj, month, annualDefault, scale = 1) => {
  if (!targetObj) return annualDefault * MONTH_WEIGHTS[month - 1] * scale;
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  const monthKey = 'target_' + monthNames[month - 1];
  const val = targetObj[monthKey];
  if (val !== null && val !== undefined && val !== '') {
    const numericVal = parseFloat(val);
    return numericVal < 100000 ? numericVal * scale : numericVal;
  }
  const annualVal = targetObj.target !== null && targetObj.target !== undefined ? parseFloat(targetObj.target) : annualDefault;
  return annualVal * MONTH_WEIGHTS[month - 1] * scale;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Achievement percentage, respecting inverse polarity */
function calcAch(real, target, isInverse = false) {
  if (real == null || target == null || target === 0) return null;
  const raw = isInverse ? (target / Math.max(0.001, real)) * 100 : (real / target) * 100;
  return Math.min(raw, 200); // cap at 200% to avoid nonsensical numbers
}

/** Status label and color from achievement % */
function statusFromAch(ach, isInverse = false) {
  if (ach == null) return { label: 'Belum Ada Data', color: 'neutral', dot: '#6B7280' };
  // For non-inverse: higher is better. For inverse: we've already converted so higher = better.
  if (ach >= 95) return { label: 'Tercapai',      color: 'success', dot: '#10B981' };
  if (ach >= 85) return { label: 'Mendekati',     color: 'warning', dot: '#F59E0B' };
  return           { label: 'Perlu Perhatian', color: 'danger',  dot: '#EF4444' };
}

// ─── Module: Jaringan ────────────────────────────────────────────────────────

function buildJaringanCard(dashData) {
  const kpis = dashData?.overview?.kpis || {};

  const saidi = kpis.saidi;
  const saifi = kpis.saifi;
  const ens   = kpis.ens;
  const losses = kpis.losses;

  const saidiAch  = saidi  ? calcAch(saidi.val,  saidi.target,  true) : null;
  const saifiAch  = saifi  ? calcAch(saifi.val,  saifi.target,  true) : null;
  const lossesAch = losses ? calcAch(losses.val, losses.target, true) : null;

  // Main achievement = weighted average of SAIDI + SAIFI (primary reliability metrics)
  let mainAch = null;
  const vals = [saidiAch, saifiAch, lossesAch].filter(v => v != null);
  if (vals.length > 0) mainAch = vals.reduce((s, v) => s + v, 0) / vals.length;

  const metrics = [
    saidi  ? { label: 'SAIDI YTD',      real: saidi.val?.toFixed(2),  target: saidi.target?.toFixed(2),  ach: saidiAch,  unit: 'mnt/plg', isInverse: true } : null,
    saifi  ? { label: 'SAIFI YTD',      real: saifi.val?.toFixed(3),  target: saifi.target?.toFixed(3),  ach: saifiAch,  unit: 'kali/plg', isInverse: true } : null,
    ens    ? { label: 'ENS',            real: ens.val,                 target: ens.target,                ach: null,       unit: 'kWh',     isInverse: true } : null,
    losses ? { label: 'Susut Jaringan', real: losses.val?.toFixed(2), target: losses.target?.toFixed(2), ach: lossesAch, unit: '%',       isInverse: true } : null,
  ].filter(Boolean);

  return {
    id: 'jaringan',
    label: 'Jaringan',
    icon: 'Activity',
    color: 'blue',
    path: '/saidi',
    mainAch,
    metrics,
  };
}

// ─── Module: Pemasaran ───────────────────────────────────────────────────────

async function buildPemasaranCard(year) {
  // Single call — much faster than getPemasaranData() which does 12 calls
  let rawData = [];
  try {
    const res = await api.get(`/kinerja/pemasaran?tahun=${year}`);
    rawData = res.data || [];
  } catch (e) {
    console.warn('[home] Pemasaran fetch failed:', e);
  }

  // Also fetch annual targets
  let annualPenjualanGwh = 59.0; // GWh default
  let annualPelanggan    = 10158;
  try {
    const targetsRes = await api.get(`/targets?tahun=${year}`);
    const targets = targetsRes.data || [];
    const pen = targets.find(t => t.indikator === 'Penjualan');
    if (pen) annualPenjualanGwh = parseFloat(pen.target);
    const pel = targets.find(t => t.indikator === 'Jumlah Pelanggan');
    if (pel) annualPelanggan = parseFloat(pel.target);
  } catch (e) { /* use defaults */ }

  // Calculate cumulative YTD from raw monthly data
  const TARIF_KEYS = ['s','r','b','i','p','t','l','c'];
  let cumPenjKwh = 0, cumPelanggan = 0;
  let hasData = false;
  let lastFilledMonth = 0;

  rawData.forEach(item => {
    if (!item.periode) return;
    const m   = parseInt(item.periode.bulan);
    const raw = item.data_realisasi != null && typeof item.data_realisasi === 'object'
      ? item.data_realisasi
      : (() => { try { return JSON.parse(item.data_realisasi || '{}') } catch { return {} } })();

    const monthPenj = TARIF_KEYS.reduce((s, k) => s + (Number(raw[`penjualan_kwh_${k}`]) || 0), 0);
    const monthPlg  = TARIF_KEYS.reduce((s, k) => s + (Number(raw[`pelanggan_${k}`]) || 0), 0);

    if (monthPenj > 0 || monthPlg > 0) {
      cumPenjKwh    += monthPenj;
      cumPelanggan  += monthPlg;
      hasData        = true;
      lastFilledMonth = Math.max(lastFilledMonth, m);
    }
  });

  // Target YTD up to lastFilledMonth
  let ytdPenjTarget = 0; // kWh
  let ytdPlgTarget  = 0;
  for (let m = 1; m <= lastFilledMonth; m++) {
    ytdPenjTarget += getMonthlyDbTarget(pen, m, annualPenjualanGwh, 1000000);
    ytdPlgTarget += getMonthlyDbTarget(pel, m, annualPelanggan, 1);
  }

  const penjAch = calcAch(cumPenjKwh, ytdPenjTarget);
  const plgAch  = calcAch(cumPelanggan, ytdPlgTarget);

  let mainAch = null;
  const vals = [penjAch, plgAch].filter(v => v != null);
  if (vals.length) mainAch = vals.reduce((s, v) => s + v, 0) / vals.length;

  const formatGwh = v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(2)} GWh` : `${(v/1000).toFixed(1)} MWh`;

  return {
    id: 'pemasaran',
    label: 'Pemasaran',
    icon: 'TrendingUp',
    color: 'green',
    path: '/pemasaran/penjualan',
    mainAch,
    metrics: hasData ? [
      { label: 'Penjualan TL YTD', real: formatGwh(cumPenjKwh),     target: formatGwh(ytdPenjTarget), ach: penjAch,  unit: '' },
      { label: 'Jumlah Pelanggan', real: Math.round(cumPelanggan),   target: Math.round(ytdPlgTarget), ach: plgAch,   unit: 'plg' },
    ] : [],
    noData: !hasData,
  };
}

// ─── Module: Niaga ───────────────────────────────────────────────────────────

function buildNiagaCard(niagaRows) {
  // niagaRows = result of getNiagaData(), filter baseline out
  const rows = (niagaRows || []).filter(r => !r.isBaseline);
  const filled = rows.filter(r => r.pelunasan_real !== null);
  const last   = filled[filled.length - 1];

  const pelAch  = last ? calcAch(last.c_pelunasan_real, last.c_pelunasan_target) : null;
  const penAch  = (() => {
    const pFilled = rows.filter(r => r.penghapusan_real !== null);
    const pLast   = pFilled[pFilled.length - 1];
    return pLast ? calcAch(pLast.c_penghapusan_real, pLast.c_penghapusan_target) : null;
  })();
  const saldoAch = (() => {
    const sFilled = rows.filter(r => r.saldo_akhir_real !== null);
    const sLast   = sFilled[sFilled.length - 1];
    return sLast?.saldo_akhir_ach ?? null;
  })();

  let mainAch = null;
  const vals = [pelAch, penAch, saldoAch].filter(v => v != null);
  if (vals.length) mainAch = vals.reduce((s, v) => s + v, 0) / vals.length;

  const formatRp = v => v == null ? '—' : v >= 1e9 ? `Rp ${(v/1e9).toFixed(2)}M` : `Rp ${(v/1e6).toFixed(1)}Jt`;

  return {
    id: 'niaga',
    label: 'Niaga',
    icon: 'Briefcase',
    color: 'orange',
    path: '/niaga/pelunasan',
    mainAch,
    metrics: [
      { label: 'Pelunasan PRR YTD',  real: formatRp(last?.c_pelunasan_real),    target: formatRp(last?.c_pelunasan_target),    ach: pelAch },
      { label: 'Penghapusan PRR',    real: rows.filter(r=>r.penghapusan_real!=null).slice(-1)[0]?.c_penghapusan_real?.toFixed(2), target: '—', ach: penAch, unit: 'Rp M' },
    ].filter(m => m.ach != null || m.real != null),
  };
}

// ─── Module: Transaksi Energi ─────────────────────────────────────────────────

function buildTECard(susutDash, gantiMeterDash, p2tlDash) {
  // Extract from dashboard API responses
  const susutReal   = susutDash?.summary?.realisasi_persen ?? susutDash?.summary?.realisasi ?? null;
  const susutTarget = susutDash?.summary?.target_persen     ?? susutDash?.summary?.target    ?? null;
  const susutAch    = calcAch(susutReal, susutTarget, true); // inverse: lower susut is better

  const gmReal   = gantiMeterDash?.summary?.total_realisasi ?? gantiMeterDash?.summary?.realisasi ?? null;
  const gmTarget = gantiMeterDash?.summary?.total_target    ?? gantiMeterDash?.summary?.target    ?? null;
  const gmAch    = calcAch(gmReal, gmTarget);

  const p2tlReal   = p2tlDash?.summary?.total_realisasi ?? p2tlDash?.summary?.realisasi ?? null;
  const p2tlTarget = p2tlDash?.summary?.total_target    ?? p2tlDash?.summary?.target    ?? null;
  const p2tlAch    = calcAch(p2tlReal, p2tlTarget);

  let mainAch = null;
  const vals = [susutAch, gmAch, p2tlAch].filter(v => v != null);
  if (vals.length) mainAch = vals.reduce((s, v) => s + v, 0) / vals.length;

  return {
    id: 'transaksi-energi',
    label: 'Transaksi Energi',
    icon: 'Zap',
    color: 'yellow',
    path: '/susut',
    mainAch,
    metrics: [
      susutAch  != null ? { label: 'Susut Distribusi', real: susutReal?.toFixed(2),    target: susutTarget?.toFixed(2),    ach: susutAch,  unit: '%',    isInverse: true } : null,
      gmAch     != null ? { label: 'Ganti Meter',       real: gmReal,                   target: gmTarget,                   ach: gmAch,     unit: 'unit' }               : null,
      p2tlAch   != null ? { label: 'P2TL',              real: p2tlReal,                 target: p2tlTarget,                 ach: p2tlAch,   unit: '' }                   : null,
    ].filter(Boolean),
  };
}

// ─── Module: Aset & Keuangan (placeholder) ────────────────────────────────────

function buildPlaceholderCard(id, label, icon, color, path) {
  return { id, label, icon, color, path, mainAch: null, metrics: [], noData: true };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fetch and aggregate KPI data from all modules.
 * @param {number} year  – Selected year (e.g. 2026)
 * @param {number} month – Selected month (1–12), used for TE dashboard endpoint
 * @returns {{ bidangCards, allMetrics, attentionItems, nkoScore }}
 */
export async function getHomeDashboardSummary(year = 2026, month = new Date().getMonth() + 1) {
  // Run all fetches in parallel — Promise.allSettled ensures partial failures are tolerated
  const [
    dashResult,
    niagaResult,
    susutResult,
    gantiMeterResult,
    p2tlResult,
  ] = await Promise.allSettled([
    getDashboardData(year),
    getNiagaData(year),
    api.get(`/v1/susut-distribusi/dashboard?tahun=${year}&bulan=${month}`),
    api.get(`/v1/ganti-meter/dashboard?tahun=${year}&bulan=${month}`),
    api.get(`/v1/p2tl/dashboard?tahun=${year}&bulan=${month}`),
  ]);

  const dashData       = dashResult.status      === 'fulfilled' ? dashResult.value        : null;
  const niagaRows      = niagaResult.status     === 'fulfilled' ? niagaResult.value        : [];
  const susutDash      = susutResult.status     === 'fulfilled' ? susutResult.value.data?.data ?? susutResult.value.data  : null;
  const gantiMeterDash = gantiMeterResult.status === 'fulfilled' ? gantiMeterResult.value.data?.data ?? gantiMeterResult.value.data : null;
  const p2tlDash       = p2tlResult.status      === 'fulfilled' ? p2tlResult.value.data?.data ?? p2tlResult.value.data   : null;

  // NKO score from dashboard
  const kpis   = dashData?.overview?.kpis || {};
  const nkoScore = kpis.nko?.val ?? null;
  const nkoTarget = kpis.nko?.target ?? 95;

  // Build per-bidang cards
  const jaringanCard = buildJaringanCard(dashData);

  // Pemasaran needs async (fetches targets)
  let pemasaranCard;
  try {
    pemasaranCard = await buildPemasaranCard(year);
  } catch (e) {
    console.warn('[home] Pemasaran card failed:', e);
    pemasaranCard = buildPlaceholderCard('pemasaran', 'Pemasaran', 'TrendingUp', 'green', '/pemasaran/penjualan');
  }

  const niagaCard       = buildNiagaCard(niagaRows);
  const teCard          = buildTECard(susutDash, gantiMeterDash, p2tlDash);
  const asetCard        = buildPlaceholderCard('aset',     'Aset',     'Package',   'purple', '/kelola-target?bidang=aset');
  const keuanganCard    = buildPlaceholderCard('keuangan', 'Keuangan', 'DollarSign','teal',   '/kelola-target?bidang=keuangan');

  const bidangCards = [jaringanCard, pemasaranCard, niagaCard, teCard, asetCard, keuanganCard];

  // ── Build flat allMetrics for KPI Scoreboard ────────────────────────────────
  const allMetrics = [
    // NKO
    {
      id: 'nko', label: 'Nilai Kinerja Org (NKO)', bidang: 'NKO',
      real: nkoScore?.toFixed(2), target: nkoTarget?.toFixed(2),
      ach: calcAch(nkoScore, nkoTarget), unit: '%', path: '/nko',
    },
    // Jaringan
    kpis.saidi ? {
      id: 'saidi', label: 'SAIDI YTD', bidang: 'Jaringan',
      real: kpis.saidi.val?.toFixed(2), target: kpis.saidi.target?.toFixed(2),
      ach: calcAch(kpis.saidi.val, kpis.saidi.target, true), unit: 'mnt/plg',
      isInverse: true, path: '/saidi',
    } : null,
    kpis.saifi ? {
      id: 'saifi', label: 'SAIFI YTD', bidang: 'Jaringan',
      real: kpis.saifi.val?.toFixed(3), target: kpis.saifi.target?.toFixed(3),
      ach: calcAch(kpis.saifi.val, kpis.saifi.target, true), unit: 'kali/plg',
      isInverse: true, path: '/saifi',
    } : null,
    kpis.losses ? {
      id: 'losses', label: 'Susut Jaringan', bidang: 'Jaringan',
      real: kpis.losses.val?.toFixed(2), target: kpis.losses.target?.toFixed(2),
      ach: calcAch(kpis.losses.val, kpis.losses.target, true), unit: '%',
      isInverse: true, path: '/susut',
    } : null,
    // Pemasaran
    ...(pemasaranCard.metrics || []).map((m, i) => ({
      id: `pemasaran_${i}`, label: m.label, bidang: 'Pemasaran',
      real: m.real, target: m.target, ach: m.ach, unit: m.unit || '',
      path: '/pemasaran/penjualan',
    })),
    // Niaga
    ...(niagaCard.metrics || []).map((m, i) => ({
      id: `niaga_${i}`, label: m.label, bidang: 'Niaga',
      real: m.real, target: m.target, ach: m.ach, unit: m.unit || '',
      path: '/niaga/pelunasan',
    })),
    // Transaksi Energi
    ...(teCard.metrics || []).map((m, i) => ({
      id: `te_${i}`, label: m.label, bidang: 'Transaksi Energi',
      real: m.real, target: m.target, ach: m.ach, unit: m.unit || '',
      isInverse: m.isInverse, path: '/susut',
    })),
  ].filter(Boolean);

  // ── Build attentionItems: top-3 metrics with lowest achievement ─────────────
  const attentionItems = [...allMetrics]
    .filter(m => m.ach != null)
    .sort((a, b) => (a.ach ?? 200) - (b.ach ?? 200))
    .slice(0, 3);

  return { bidangCards, allMetrics, attentionItems, nkoScore, statusFromAch };
}

export { statusFromAch };
