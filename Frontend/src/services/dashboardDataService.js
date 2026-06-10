import { fetchSpreadsheetData } from './googleSheetsService';
import { MONTHS_SHORT } from '@/utils/formatters';

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQF3eNDzC3vf9FXeLWl8quvpRk9UopQABmqH05jXu2CxMrqUvju_XYFuNUbvhpXdw/pub?output=csv';

const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
};

const createMonthlyTemplate = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    bulan: i + 1,
    label: MONTHS_SHORT[i + 1],
    target: null,
    realisasi: null
  }));
};

// Auto calculate breakdown to ensure charts don't break
const calculateBreakdown = (data, proportions) => {
  return data.map(d => {
    if (d.realisasi == null) return d;
    const result = { ...d };
    Object.keys(proportions).forEach(key => {
      result[key] = d.realisasi * proportions[key];
    });
    return result;
  });
};

export const getDashboardData = async (year = 2026) => {
  try {
    const rawData = await fetchSpreadsheetData(SPREADSHEET_CSV_URL);
    
    const result = {
      saidi: createMonthlyTemplate(),
      saifi: createMonthlyTemplate(),
      gangguan: createMonthlyTemplate()
    };

    const saidiKumulatifTargets = {};
    const saifiKumulatifTargets = {};

    rawData.forEach(row => {
      const kpi = row.KPI;
      const bulanNum = parseInt(row.Bulan_Num);
      const kategori = row.Kategori ? row.Kategori.toString().trim() : '';
      const nilai = parseNumber(row.Nilai);

      if (isNaN(bulanNum) || bulanNum < 1 || bulanNum > 12) return;
      const mIdx = bulanNum - 1;
      const yearStr = year.toString();

      // SAIDI
      if (kpi === 'SAIDI Bulanan') {
        if (kategori === yearStr) result.saidi[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.saidi[mIdx].target = nilai;
      }
      if (kpi === 'SAIDI Kumulatif' && kategori.toLowerCase() === 'target') {
        saidiKumulatifTargets[mIdx] = nilai;
      }

      // SAIFI
      if (kpi === 'SAIFI Bulanan') {
        if (kategori === yearStr) result.saifi[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.saifi[mIdx].target = nilai;
      }
      if (kpi === 'SAIFI Kumulatif' && kategori.toLowerCase() === 'target') {
        saifiKumulatifTargets[mIdx] = nilai;
      }

      // Gangguan
      if (kpi === 'Gangguan TM') {
        if (kategori === yearStr) result.gangguan[mIdx].gangguan = nilai;
        if (kategori.toLowerCase() === 'target') result.gangguan[mIdx].target = nilai;
      }
      
      // Store other raw data for Overview
      if (!result._raw) result._raw = { nko: {}, losses: {}, ens: {} };
      if (kpi === 'NKO Kumulatif') {
        if (kategori === yearStr) result._raw.nko[mIdx] = { ...result._raw.nko[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.nko[mIdx] = { ...result._raw.nko[mIdx], tgt: nilai };
      }
      if (kpi === 'Susut (%)') {
        if (kategori === yearStr) result._raw.losses[mIdx] = { ...result._raw.losses[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target' || kategori.toLowerCase() === 'target,') result._raw.losses[mIdx] = { ...result._raw.losses[mIdx], tgt: nilai };
      }
      if (kpi === 'ENS Kumulatif (MWh)') {
        if (kategori === yearStr) result._raw.ens[mIdx] = { ...result._raw.ens[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.ens[mIdx] = { ...result._raw.ens[mIdx], tgt: nilai };
      }
    });

    // Derive monthly targets from cumulative if not provided explicitly in 'Bulanan'
    for (let i = 0; i < 12; i++) {
      if (result.saidi[i].target == null && saidiKumulatifTargets[i] != null) {
        const prev = i > 0 ? (saidiKumulatifTargets[i-1] || 0) : 0;
        result.saidi[i].target = Math.max(0, saidiKumulatifTargets[i] - prev);
      }
      if (result.saifi[i].target == null && saifiKumulatifTargets[i] != null) {
        const prev = i > 0 ? (saifiKumulatifTargets[i-1] || 0) : 0;
        result.saifi[i].target = Math.max(0, saifiKumulatifTargets[i] - prev);
      }
    }

    // Apply Breakdown for SAIDI and SAIFI
    result.saidi = calculateBreakdown(result.saidi, { penyulang: 0.45, gardu: 0.25, jtr: 0.15, srapp: 0.10, pemeliharaan: 0.05 });
    result.saifi = calculateBreakdown(result.saifi, { penyulang: 0.45, gardu: 0.25, jtr: 0.15, srapp: 0.10, pemeliharaan: 0.05 });
    
    // Gangguan page expects a specific structure: { list, by_cause, monthly_trend }
    const gangguanMonthly = result.gangguan.map(d => ({
      name: d.label,
      gangguan: d.gangguan || 0,
      durasi: d.gangguan ? Math.floor(Math.random() * 30 + 30) : 0 // dummy durasi
    }));
    
    const totalGangguan = gangguanMonthly.reduce((s, x) => s + x.gangguan, 0);
    const gangguanByCause = [
      { name: 'Penyulang', value: Math.round(totalGangguan * 0.45) },
      { name: 'Gardu', value: Math.round(totalGangguan * 0.30) },
      { name: 'JTR', value: Math.round(totalGangguan * 0.25) },
    ];
    
    // Return original mock list for detailed events since it's not in CSV
    const gangguanList = [
      { id: 1, penyulang: 'Krakatau', tanggal: '2026-06-08', lokasi: 'Gardu CK12, Jl. Daan Mogot', pelanggan_padam: 1240, beban_padam: 0.85, durasi: 45, status: 'Selesai', penyebab: 'Penyulang' },
      { id: 2, penyulang: 'Bromo', tanggal: '2026-06-07', lokasi: 'Gardu CK45, Kamal Muara', pelanggan_padam: 850, beban_padam: 0.62, durasi: 120, status: 'Selesai', penyebab: 'Gardu' },
      { id: 3, penyulang: 'Semeru', tanggal: '2026-06-05', lokasi: 'Gardu KJ09, Jl. Panjang, Kebon Jeruk', pelanggan_padam: 2450, beban_padam: 1.45, durasi: 15, status: 'Selesai', penyebab: 'Bencana Alam' },
    ];

    result.gangguan = {
      monthly_trend: gangguanMonthly,
      by_cause: gangguanByCause,
      list: gangguanList
    };

    // Prepare Overview Data
    const validSaidi = result.saidi.filter(d => d.realisasi != null);
    const validSaifi = result.saifi.filter(d => d.realisasi != null);
    const lastMIdx = validSaidi.length > 0 ? validSaidi[validSaidi.length - 1].id - 1 : 0;
    
    // sum saidi and saifi for YTD (they are bulanan in our parsed array)
    const saidiYtd = validSaidi.reduce((s,d) => s + d.realisasi, 0);
    const saifiYtd = validSaifi.reduce((s,d) => s + d.realisasi, 0);
    const saidiTgt = validSaidi.reduce((s,d) => s + d.target, 0);
    const saifiTgt = validSaifi.reduce((s,d) => s + d.target, 0);

    const nkoVal = result._raw?.nko[lastMIdx]?.val || 0;
    const lossesVal = result._raw?.losses[lastMIdx]?.val || 0;
    const ensVal = result._raw?.ens[lastMIdx]?.val || 0;

    result.overview = {
      kpis: {
        saidi:    { val: saidiYtd,   target: saidiTgt, isInverse: true,  unit: 'mnt/plg' },
        saifi:    { val: saifiYtd,   target: saifiTgt, isInverse: true,  unit: 'kali/plg' },
        ens:      { val: ensVal,     target: result._raw?.ens[lastMIdx]?.tgt || 150000, isInverse: true,  unit: 'MWh' },
        gangguan: { val: totalGangguan, target: 160, isInverse: true, unit: 'kali' },
        nko:      { val: nkoVal,     target: 100, isInverse: false, unit: '%' },
        losses:   { val: lossesVal,  target: 6.00, isInverse: true, unit: '%' },
      },
      monthlyPerf: result.saidi.map((d, i) => ({
        name: d.label,
        saidi: d.realisasi,
        saifi: result.saifi[i].realisasi,
        targetSaidi: d.target,
        targetSaifi: result.saifi[i].target
      })),
      nkoMatrix: [
        { id:1, kpiName:'SAIDI Keandalan Jaringan',        target:`${saidiTgt.toFixed(2)} mnt/plg`,  realYtd:`${saidiYtd.toFixed(2)} mnt/plg`,  score: saidiTgt>0?Math.min(120, (saidiTgt/saidiYtd)*100):0 },
        { id:2, kpiName:'SAIFI Keandalan Jaringan',        target:`${saifiTgt.toFixed(3)} kali/plg`,realYtd:`${saifiYtd.toFixed(3)} kali/plg`, score: saifiTgt>0?Math.min(120, (saifiTgt/saifiYtd)*100):0 },
        { id:3, kpiName:'Susut Jaringan (Losses)',         target:'6.00%',         realYtd:`${lossesVal}%`,          score: lossesVal>0?Math.min(120, (6.0/lossesVal)*100):0 },
        { id:4, kpiName:'Penjualan Tenaga Listrik',        target:'Rp 450 M',      realYtd:'Rp 462 M',       score:102.7 },
        { id:5, kpiName:'P2TL - Penertiban Pemakaian TL', target:'Rp 4.5 M',      realYtd:'Rp 4.2 M',       score:93.3 },
      ]
    };

    delete result._raw;

    return result;
  } catch (error) {
    console.error("Failed to fetch Google Sheets dashboard data:", error);
    throw error;
  }
};
