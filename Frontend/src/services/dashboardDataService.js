import { fetchSpreadsheetData } from './googleSheetsService';
import { MONTHS_SHORT } from '@/utils/formatters';

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA';

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

const calculateBreakdown = (data, proportions) => {
  return data.map(d => {
    const result = { ...d };
    if (d.realisasi != null) {
      Object.keys(proportions).forEach(key => {
        result[key] = d.realisasi * proportions[key];
      });
    }
    if (d.cumulativeReal != null) {
      Object.keys(proportions).forEach(key => {
        result[`c_${key}`] = d.cumulativeReal * proportions[key];
      });
    }
    return result;
  });
};

export const getDashboardData = async (year = 2026) => {
  try {
    let urlsToFetch = [SPREADSHEET_CSV_URL];
    
    const saved = localStorage.getItem('sigap_spreadsheet_urls');
    if (saved) {
       try {
         const parsed = JSON.parse(saved);
         const validUrls = Object.values(parsed).filter(url => typeof url === 'string' && url.trim().length > 0);
         if (validUrls.length > 0) {
           urlsToFetch = validUrls;
         }
       } catch(e) { console.error('Error parsing urls from localStorage', e); }
    }

    const allFetches = urlsToFetch.map(url => fetchSpreadsheetData(url).catch(e => {
        console.error("Failed to fetch from URL:", url, e);
        return []; 
    }));
    
    const results = await Promise.all(allFetches);
    const rawData = results.flat();
    
    const result = {
      saidi: createMonthlyTemplate(),
      saifi: createMonthlyTemplate(),
      gangguan: createMonthlyTemplate()
    };

    const saidiKumulatifTargets = {};
    const saifiKumulatifTargets = {};
    const yearStr = year.toString();

    rawData.forEach((row, rowIndex) => {
      const keys = Object.keys(row);
      const isUnpivoted = row.Bulan_Num !== undefined || row.Nilai !== undefined;
      
      if (isUnpivoted) {
        const kpi = row.KPI ? row.KPI.trim() : '';
        if (!kpi) return;
        const kategori = row.Kategori ? row.Kategori.toString().trim() : '';
        const bulanNum = parseInt(row.Bulan_Num);
        if (isNaN(bulanNum) || bulanNum < 1 || bulanNum > 12) return;
        const mIdx = bulanNum - 1;
        const nilai = parseNumber(row.Nilai);
        processCell(kpi, kategori, mIdx, nilai);
      } else {
        if (keys.length < 3) return;
        const kpi = row[keys[1]]?.trim();
        if (!kpi) return;
        const kategori = row[keys[2]]?.toString().trim();
        for (let i = 0; i < 12; i++) {
          const colKey = keys[i + 3];
          if (!colKey) continue;
          let nilai = parseNumber(row[colKey]);
          processCell(kpi, kategori, i, nilai);
        }
      }
    });

    function processCell(kpi, kategori, mIdx, nilai) {
      if (kpi === 'Penjualan Tenaga Listrik (GWh)') {
        if (kategori === yearStr) result.penjualan[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.penjualan[mIdx].target = nilai;
      }
      if (kpi === 'Pendapatan Penjualan TL (Milyar Rp)') {
        if (kategori === yearStr) result.pendapatan[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.pendapatan[mIdx].target = nilai;
      }
      if (kpi === 'SAIDI Bulanan') {
        if (kategori === yearStr) result.saidi[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.saidi[mIdx].target = nilai;
      }
      if (kpi === 'SAIDI Kumulatif') {
        if (kategori === yearStr) result.saidi[mIdx].cumulativeReal = nilai;
        if (kategori.toLowerCase() === 'target') {
          saidiKumulatifTargets[mIdx] = nilai;
          result.saidi[mIdx].cumulativeTgt = nilai;
        }
      }
      if (kpi === 'SAIFI Bulanan') {
        if (kategori === yearStr) result.saifi[mIdx].realisasi = nilai;
        if (kategori.toLowerCase() === 'target') result.saifi[mIdx].target = nilai;
      }
      if (kpi === 'SAIFI Kumulatif') {
        if (kategori === yearStr) result.saifi[mIdx].cumulativeReal = nilai;
        if (kategori.toLowerCase() === 'target') {
          saifiKumulatifTargets[mIdx] = nilai;
          result.saifi[mIdx].cumulativeTgt = nilai;
        }
      }
      if (kpi === 'Gangguan TM') {
        if (kategori === yearStr) result.gangguan[mIdx].gangguan = nilai;
        if (kategori.toLowerCase() === 'target') result.gangguan[mIdx].target = nilai;
      }
      
      if (!result._raw) result._raw = { 
        nko: {}, losses: {}, ens: {}, 
        ensBulananAll: {}, ensKumulatifAll: {},
        penjualan: {}, gantiMeter: {}, p2tlPerolehan: {}, p2tlPenyelesaian: {} 
      };
      
      if (kpi === 'NKO Kumulatif' || kpi === 'NKO (%)') {
        if (kategori === yearStr) result._raw.nko[mIdx] = { ...result._raw.nko[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.nko[mIdx] = { ...result._raw.nko[mIdx], tgt: nilai };
      }
      if (kpi === 'Susut (%)' || kpi === 'Susut / Losses (%)') {
        if (kategori === yearStr) result._raw.losses[mIdx] = { ...result._raw.losses[mIdx], val: nilai };
        if (kategori.toLowerCase().includes('target')) result._raw.losses[mIdx] = { ...result._raw.losses[mIdx], tgt: nilai };
      }
      if (kpi === 'ENS Bulanan (MWh)') {
        if (!result._raw.ensBulananAll[mIdx]) result._raw.ensBulananAll[mIdx] = {};
        const key = kategori.toLowerCase() === 'target' ? 'target' : kategori;
        result._raw.ensBulananAll[mIdx][key] = nilai;
      }
      if (kpi === 'ENS Kumulatif (MWh)') {
        if (kategori === yearStr) result._raw.ens[mIdx] = { ...result._raw.ens[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.ens[mIdx] = { ...result._raw.ens[mIdx], tgt: nilai };
        
        if (!result._raw.ensKumulatifAll[mIdx]) result._raw.ensKumulatifAll[mIdx] = {};
        const key = kategori.toLowerCase() === 'target' ? 'target' : kategori;
        result._raw.ensKumulatifAll[mIdx][key] = nilai;
      }
      if (kpi === 'Penjualan TL (GWh)') {
        if (kategori === yearStr) result._raw.penjualan[mIdx] = { ...result._raw.penjualan[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.penjualan[mIdx] = { ...result._raw.penjualan[mIdx], tgt: nilai };
      }
      if (kpi === 'Penyelesaian Ganti Meter') {
        if (kategori === yearStr) result._raw.gantiMeter[mIdx] = { ...result._raw.gantiMeter[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.gantiMeter[mIdx] = { ...result._raw.gantiMeter[mIdx], tgt: nilai };
      }
      if (kpi === 'Perolehan P2TL' || kpi === 'Perolehan Temuan P2TL') {
        if (kategori.toLowerCase() === 'realisasi') result._raw.p2tlPerolehan[mIdx] = { ...result._raw.p2tlPerolehan[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.p2tlPerolehan[mIdx] = { ...result._raw.p2tlPerolehan[mIdx], tgt: nilai };
        if (kategori.toLowerCase() === 'pencapaian') result._raw.p2tlPerolehan[mIdx] = { ...result._raw.p2tlPerolehan[mIdx], pencapaian: nilai };
      }
      if (kpi === 'Penyelesaian P2TL' || kpi === 'Penyelesaian Temuan P2TL') {
        if (kategori.toLowerCase() === 'realisasi' || kategori === yearStr) result._raw.p2tlPenyelesaian[mIdx] = { ...result._raw.p2tlPenyelesaian[mIdx], val: nilai };
        if (kategori.toLowerCase() === 'target') result._raw.p2tlPenyelesaian[mIdx] = { ...result._raw.p2tlPenyelesaian[mIdx], tgt: nilai };
        if (kategori.toLowerCase() === 'pencapaian') result._raw.p2tlPenyelesaian[mIdx] = { ...result._raw.p2tlPenyelesaian[mIdx], pencapaian: nilai };
      }
      if (kategori === yearStr && kpi === 'Gangguan TM > 5 Menit') result.gangguan[mIdx].gt5 = nilai || 0;
      if (kategori === yearStr && kpi === 'Gangguan TM ≤ 5 Menit') result.gangguan[mIdx].le5 = nilai || 0;
      if (kategori === yearStr && kpi === 'Gangguan Berulang') result.gangguan[mIdx].berulang = nilai || 0;
    }

    // Derive monthly realisasi and targets from cumulative if not provided explicitly in 'Bulanan'
    for (let i = 0; i < 12; i++) {
      if (result.saidi[i].target == null && saidiKumulatifTargets[i] != null) {
        result.saidi[i].target = saidiKumulatifTargets[i];
      }
      if (result.saidi[i].realisasi == null && result.saidi[i].cumulativeReal != null) {
        result.saidi[i].realisasi = result.saidi[i].cumulativeReal;
      }

      if (result.saifi[i].target == null && saifiKumulatifTargets[i] != null) {
        result.saifi[i].target = saifiKumulatifTargets[i];
      }
      if (result.saifi[i].realisasi == null && result.saifi[i].cumulativeReal != null) {
        result.saifi[i].realisasi = result.saifi[i].cumulativeReal;
      }
    }

    // Fetch Breakdown data only for 2026
    if (yearStr === '2026') {
      try {
        const bRawData = await fetchSpreadsheetData('https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=BREAKDOWN_SAIDI_SAIFI_ENS');
        let currentSection = 'SAIDI'; // Default to SAIDI because its title is in the header
        bRawData.forEach(row => {
          const keys = Object.keys(row);
          const compNameRaw = row[keys[1]];
          if (!compNameRaw || typeof compNameRaw !== 'string') return;
          
          const compName = compNameRaw.trim();
          
          if (compName.includes('SAIDI BULANAN')) { currentSection = 'SAIDI'; return; }
          if (compName.includes('SAIFI BULANAN')) { currentSection = 'SAIFI'; return; }
          if (compName.includes('ENS BULANAN')) { currentSection = 'ENS'; return; }
          if (compName.includes('TOTAL') || compName.includes('Komponen') || compName.includes('BREAKDOWN')) return;
          
          if (!currentSection) return;
          
          const mapCompName = (name) => {
            name = name.toLowerCase();
            if (name.includes('har') || name.includes('pemeliharaan')) return 'pemeliharaan';
            if (name.includes('penyulang')) return 'penyulang';
            if (name.includes('gardu')) return 'gardu';
            if (name.includes('jtr')) return 'jtr';
            if (name.includes('sr & app') || name.includes('srapp')) return 'srapp';
            if (name.includes('bencana')) return 'bencana_alam';
            if (name.includes('sistem') || name.includes('transmisi')) return 'transmisi';
            return null;
          };
          
          const field = mapCompName(compName);
          if (field) {
            keys.forEach(k => {
              const mIdx = MONTHS_SHORT.indexOf(k.trim());
              if (mIdx > 0) {
                let val = parseNumber(row[k]);
                if (val != null) {
                  if (currentSection === 'SAIDI') result.saidi[mIdx - 1][field] = val;
                  else if (currentSection === 'SAIFI') result.saifi[mIdx - 1][field] = val;
                }
              }
            });
          }
        });
        
        // Calculate cumulative breakdown manually from the parsed bulanan
        ['saidi', 'saifi'].forEach(kpi => {
          const fields = ['pemeliharaan', 'penyulang', 'gardu', 'jtr', 'srapp', 'bencana_alam', 'transmisi'];
          result[kpi].forEach((d, i) => {
            let sumB = 0;
            fields.forEach(f => {
              if (d[f] != null) {
                sumB += d[f];
                const prevC = i > 0 ? (result[kpi][i-1][`c_${f}`] || 0) : 0;
                result[kpi][i][`c_${f}`] = prevC + d[f];
              }
            });
            // Auto-fill realisasi from breakdown if it is missing in MASTER_DATA
            if (d.realisasi === null && sumB > 0) {
              d.realisasi = sumB;
            }
          });
        });
      } catch (err) {
        console.warn("Failed to fetch BREAKDOWN sheet, falling back to empty breakdown.", err);
      }
    }
    
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

    // Prepare NKO Table Data
    const nkoTableData = [];
    for (let i = 0; i < 12; i++) {
      const calcPencapaian = (real, tgt, isInverse = false) => {
        if (tgt == null || real == null || tgt === 0) return 0;
        let pct = isInverse ? (tgt / real) * 100 : (real / tgt) * 100;
        // The image shows some pencapaian capped at 110% when it overflows wildly.
        // But for precision, we return the exact percentage.
        return Math.max(pct, 0); 
      };

      const ensTgt = result._raw?.ens[i]?.tgt || 0;
      const ensVal = result._raw?.ens[i]?.val || 0;
      
      const penTgt = result._raw?.penjualan[i]?.tgt || 0;
      const penVal = result._raw?.penjualan[i]?.val || 0;

      const gmTgt = result._raw?.gantiMeter[i]?.tgt || 0;
      const gmVal = result._raw?.gantiMeter[i]?.val || 0;

      const p2tlSelesaiTgt = 100; 
      const p2tlSelesaiVal = result._raw?.p2tlPenyelesaian[i]?.val || 0; 
      // sometimes pencapaian is already present
      let p2tlSelesaiPct = result._raw?.p2tlPenyelesaian[i]?.pencapaian ? result._raw.p2tlPenyelesaian[i].pencapaian * 100 : calcPencapaian(p2tlSelesaiVal, p2tlSelesaiTgt, false);

      const p2tlOlehTgt = 100; 
      const p2tlOlehVal = result._raw?.p2tlPerolehan[i]?.val ? (result._raw.p2tlPerolehan[i].val / 10000) : 0; // dummy scale
      let p2tlOlehPct = result._raw?.p2tlPerolehan[i]?.pencapaian ? result._raw.p2tlPerolehan[i].pencapaian * 100 : 0;
      
      // If we don't have real values, fallback to 0
      if (!p2tlOlehPct) p2tlOlehPct = 0;

      const saidiTgt = result.saidi[i].target || 0;
      const saidiVal = result.saidi[i].realisasi || 0;

      const saifiTgt = result.saifi[i].target || 0;
      const saifiVal = result.saifi[i].realisasi || 0;

      const susutTgt = result._raw?.losses[i]?.tgt || 0;
      const susutVal = result._raw?.losses[i]?.val || 0;

      nkoTableData.push({
        bulan: i + 1,
        label: MONTHS_SHORT[i + 1],
        totalNko: result._raw?.nko[i]?.val || 0,
        metrics: [
          { kpi: 'ENS', satuan: 'MWh', target: ensTgt, realisasi: ensVal, pencapaian: calcPencapaian(ensVal, ensTgt, true), isInverse: true },
          { kpi: 'Penjualan Tenaga Listrik', satuan: 'GWh', target: penTgt, realisasi: penVal, pencapaian: calcPencapaian(penVal, penTgt, false) },
          { kpi: 'Penyelesaian Ganti Meter', satuan: 'Unit', target: gmTgt, realisasi: gmVal, pencapaian: calcPencapaian(gmVal, gmTgt, false) },
          { kpi: 'Penyelesaian Temuan P2TL', satuan: '%', target: p2tlSelesaiTgt, realisasi: p2tlSelesaiVal, pencapaian: p2tlSelesaiPct },
          { kpi: 'Perolehan Temuan P2TL', satuan: '%', target: p2tlOlehTgt, realisasi: p2tlOlehVal, pencapaian: p2tlOlehPct },
          { kpi: 'SAIDI', satuan: 'menit/pelanggan', target: saidiTgt, realisasi: saidiVal, pencapaian: calcPencapaian(saidiVal, saidiTgt, true), isInverse: true },
          { kpi: 'SAIFI', satuan: 'kali/pelanggan', target: saifiTgt, realisasi: saifiVal, pencapaian: calcPencapaian(saifiVal, saifiTgt, true), isInverse: true },
          { kpi: 'Susut Distribusi', satuan: '%', target: susutTgt, realisasi: susutVal, pencapaian: calcPencapaian(susutVal, susutTgt, true), isInverse: true },
        ]
      });
    }
    result.nkoTable = nkoTableData;

    // Prepare Overview Data
    const validSaidi = result.saidi.filter(d => d.realisasi != null);
    const validSaifi = result.saifi.filter(d => d.realisasi != null);
    const lastMIdx = validSaidi.length > 0 ? validSaidi[validSaidi.length - 1].id - 1 : 0;
    
    // sum saidi and saifi for YTD (they are bulanan in our parsed array)
    const saidiYtd = validSaidi.length > 0 ? (validSaidi[validSaidi.length - 1].cumulativeReal ?? validSaidi.reduce((s,d) => s + d.realisasi, 0)) : 0;
    const saifiYtd = validSaifi.length > 0 ? (validSaifi[validSaifi.length - 1].cumulativeReal ?? validSaifi.reduce((s,d) => s + d.realisasi, 0)) : 0;
    const saidiTgt = validSaidi.length > 0 ? (validSaidi[validSaidi.length - 1].cumulativeTgt ?? validSaidi.reduce((s,d) => s + d.target, 0)) : 0;
    const saifiTgt = validSaifi.length > 0 ? (validSaifi[validSaifi.length - 1].cumulativeTgt ?? validSaifi.reduce((s,d) => s + d.target, 0)) : 0;

    // Independent last month indexes for each KPI
    const validNkoIdx = Object.keys(result._raw?.nko || {}).map(Number).filter(m => result._raw.nko[m]?.val != null).sort((a,b)=>a-b).pop() ?? 0;
    const validLossesIdx = Object.keys(result._raw?.losses || {}).map(Number).filter(m => result._raw.losses[m]?.val != null).sort((a,b)=>a-b).pop() ?? 0;
    const validEnsIdx = Object.keys(result._raw?.ens || {}).map(Number).filter(m => result._raw.ens[m]?.val != null).sort((a,b)=>a-b).pop() ?? 0;

    const nkoVal = result._raw?.nko[validNkoIdx]?.val || 0;
    const lossesVal = result._raw?.losses[validLossesIdx]?.val || 0;
    const ensVal = result._raw?.ens[validEnsIdx]?.val || 0;
    const ensTgt = result._raw?.ens[validEnsIdx]?.tgt || 150000;

    result.overview = {
      kpis: {
        saidi:    { val: saidiYtd,   target: saidiTgt, isInverse: true,  unit: 'mnt/plg' },
        saifi:    { val: saifiYtd,   target: saifiTgt, isInverse: true,  unit: 'kali/plg' },
        ens:      { val: ensVal,     target: ensTgt, isInverse: true,  unit: 'MWh' },
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

    // Prepare ENS Page Data
    const ensMonthlyData = [];
    for (let i = 0; i < 12; i++) {
      const bRaw = result._raw.ensBulananAll[i] || {};
      const kRaw = result._raw.ensKumulatifAll[i] || {};

      // Use the current year for breakdown dummy (fallback to 0 if null)
      const bCurr = bRaw[year.toString()] || 0;
      const kCurr = kRaw[year.toString()] || 0;

      ensMonthlyData.push({
        bulan: i + 1,
        label: MONTHS_SHORT[i + 1],
        bulanan: {
          ...bRaw,
          target: bRaw['target'] || null, // ensure target is always present even if null
          padam_terencana: bCurr * 0.35,
          tidak_terencana: bCurr * 0.50,
          bencana_alam: bCurr * 0.15
        },
        kumulatif: {
          ...kRaw,
          target: kRaw['target'] || null,
          padam_terencana: kCurr * 0.35,
          tidak_terencana: kCurr * 0.50,
          bencana_alam: kCurr * 0.15
        }
      });
    }
    result.ensPageData = ensMonthlyData;

    delete result._raw;

    return result;
  } catch (error) {
    console.error("Failed to fetch Google Sheets dashboard data:", error);
    throw error;
  }
};
