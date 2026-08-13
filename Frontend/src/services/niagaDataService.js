/**
 * niagaDataService.js
 * Service layer to handle Niaga (Commercial) KPI data from database.
 */
import api from './api';

const MONTHS_SHORT = { 
  1:'Jan', 2:'Feb', 3:'Mar', 4:'Apr', 5:'Mei', 6:'Jun', 
  7:'Jul', 8:'Ags', 9:'Sep', 10:'Okt', 11:'Nov', 12:'Des' 
};

const MONTH_WEIGHTS = [0.077, 0.074, 0.082, 0.080, 0.083, 0.081, 0.086, 0.088, 0.085, 0.084, 0.083, 0.077];

export async function getNiagaData(year = 2026) {
  const currentYear = parseInt(year) || new Date().getFullYear();

  // 1. Fetch annual targets from DB
  let targetPelunasan = 40000000000; // Rp (40 Miliar)
  let targetPenghapusan = 30.0; // Rp Miliar
  let targetSaldoAkhir = 571575272; // Rp (Absolute)

  let pel = null;
  let pen = null;
  let lbkb = null;

  try {
    const targetsRes = await api.get(`/v1/targets?tahun=${currentYear}`);
    const dbTargets = targetsRes.data || [];
    
    pel = dbTargets.find(t => t.indikator === 'Pelunasan PRR' || t.indikator === 'Pelunasan PRR & Piutang');
    if (pel && pel.target != null) {
      const val = parseFloat(pel.target);
      targetPelunasan = val < 1000 ? val * 1000000000 : val;
    }

    pen = dbTargets.find(t => t.indikator === 'Penghapusan PRR');
    if (pen && pen.target != null) {
      targetPenghapusan = parseFloat(pen.target);
    }

    lbkb = dbTargets.find(t => t.indikator === 'Saldo Akhir');
    if (lbkb && lbkb.target != null) {
      const val = parseFloat(lbkb.target);
      targetSaldoAkhir = val < 1000 ? val * 1000000000 : val;
    }
  } catch (e) {
    console.warn("Failed to fetch Niaga targets, using defaults", e);
  }

  // Fetch Penghapusan PRR detail totals from v1/niaga/penghapusan
  let penghapusanMap = {};
  let penghapusanDetailsMap = {};
  try {
    const penRes = await api.get(`/v1/niaga/penghapusan?tahun=${currentYear}`);
    if (penRes.data && penRes.data.monthly) {
      penRes.data.monthly.forEach(item => {
        penghapusanMap[parseInt(item.bulan)] = parseFloat(item.total_nominal || 0);
      });
    }
    if (penRes.data && penRes.data.details) {
      penRes.data.details.forEach(item => {
        const b = parseInt(item.bulan);
        if (!penghapusanDetailsMap[b]) {
          penghapusanDetailsMap[b] = [];
        }
        penghapusanDetailsMap[b].push(item);
      });
    }
  } catch (e) {
    console.warn("Failed to fetch Penghapusan PRR details total", e);
  }

  // Fetch previous year's realisations for baseline (Desember tahun sebelumnya)
  let baselineRecord = null;
  try {
    const prevRes = await api.get(`/v1/kinerja/niaga?tahun=${currentYear - 1}`);
    if (prevRes.data && Array.isArray(prevRes.data)) {
      const decItem = prevRes.data.find(item => item.periode && parseInt(item.periode.bulan) === 12);
      if (decItem) {
        const raw = decItem.data_realisasi;
        baselineRecord = (typeof raw === 'string') ? JSON.parse(raw || '{}') : (raw || {});
      }
    }
  } catch (e) {
    console.warn("Failed to fetch previous year baseline", e);
  }


  // 2. Fetch monthly realisations from DB
  const realMap = {};
  try {
    const res = await api.get(`/v1/kinerja/niaga?tahun=${currentYear}`);
    // v1 API returns {value: [...]} (PowerShell ConvertTo-Json format) OR plain array
    const items = Array.isArray(res.data) ? res.data 
      : Array.isArray(res.data?.value) ? res.data.value
      : Array.isArray(res.data?.data) ? res.data.data 
      : [];
    items.forEach(item => {
      if (item.periode && item.periode.bulan) {
        const raw = item.data_realisasi;
        const parsed = (typeof raw === 'string') ? JSON.parse(raw || '{}') : (raw || {});
        realMap[parseInt(item.periode.bulan)] = parsed;
      }
    });
  } catch (e) {
    console.warn("Failed to fetch Niaga realisations from backend", e);
  }

  // Build baseline row
  let baselineRow = null;
  if (baselineRecord) {
    let baseReal = baselineRecord['tindak_lanjut_lbkb'] !== undefined 
      ? parseFloat(baselineRecord['tindak_lanjut_lbkb']) 
      : (baselineRecord['saldo_akhir_real'] !== undefined ? parseFloat(baselineRecord['saldo_akhir_real']) : null);
      
    if (baseReal !== null && baseReal < 1000) baseReal = baseReal * 1000000000;
    
    let basePal = baselineRecord['pal_total'] !== undefined ? parseFloat(baselineRecord['pal_total']) : null;
    if (basePal !== null && basePal < 1000 && baseReal !== null && baseReal < 1000) basePal = basePal * 1000000000;
    
    let baseTs = baselineRecord['ts_total'] !== undefined ? parseFloat(baselineRecord['ts_total']) : null;
    if (baseTs !== null && baseTs < 1000 && baseReal !== null && baseReal < 1000) baseTs = baseTs * 1000000000;

    baselineRow = {
      bulan: 0,
      label: 'Des (Prev)',
      isBaseline: true,
      
      pelunasan_target: null,
      pelunasan_real: null,
      tunai_prr: null,
      cicil_prr: null,
      ts_prabayar: null,

      penghapusan_target: null,
      penghapusan_real: null,

      saldo_akhir_target: null,
      saldo_akhir_real: baseReal,
      pal_total: basePal,
      ts_total: baseTs,
      rata_rata_saldo: baseReal,
      saldo_akhir_ach: null,
      _hasData: true
    };
  } else {
    baselineRow = {
      bulan: 0,
      label: 'Des (Prev)',
      isBaseline: true,
      
      pelunasan_target: null,
      pelunasan_real: null,
      tunai_prr: null,
      cicil_prr: null,
      ts_prabayar: null,

      penghapusan_target: null,
      penghapusan_real: null,

      saldo_akhir_target: null,
      saldo_akhir_real: null,
      pal_total: null,
      ts_total: null,
      rata_rata_saldo: null,
      saldo_akhir_ach: null,
      _hasData: false
    };
  }

  // 3. Build 12-month data
  const janToDecRows = [];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  for (let m = 1; m <= 12; m++) {
    const w = MONTH_WEIGHTS[m - 1];
    const real = realMap[m] || null;
    const monthKey = 'target_' + monthNames[m - 1];

    // Monthly targets
    let tgtPelunasan;
    if (pel && pel[monthKey] !== null && pel[monthKey] !== undefined && pel[monthKey] !== '') {
      const val = parseFloat(pel[monthKey]);
      tgtPelunasan = val < 1000 ? val * 1000000000 : val;
    } else {
      tgtPelunasan = targetPelunasan * w;
    }

    let tgtPenghapusan;
    if (pen && pen[monthKey] !== null && pen[monthKey] !== undefined && pen[monthKey] !== '') {
      tgtPenghapusan = parseFloat(pen[monthKey]);
    } else {
      tgtPenghapusan = targetPenghapusan * w;
    }

    let tgtSaldoAkhir;
    if (lbkb && lbkb[monthKey] !== null && lbkb[monthKey] !== undefined && lbkb[monthKey] !== '') {
      const val = parseFloat(lbkb[monthKey]);
      tgtSaldoAkhir = val < 1000 ? val * 1000000000 : val;
    } else {
      tgtSaldoAkhir = targetSaldoAkhir; // Saldo Akhir target is not weighted!
    }

    // Monthly realisations (keys mapped to snake_case equivalent generated by Input page)
    let realPelunasan = null;
    let tunaiPrr = null;
    let cicilPrr = null;
    let tsPrabayar = null;

    if (real) {
      if (real['pelunasan_prr_&_piutang'] !== undefined && real['pelunasan_prr_&_piutang'] !== null) {
        realPelunasan = parseFloat(real['pelunasan_prr_&_piutang']);
      } else if (real['pelunasan_real'] !== undefined && real['pelunasan_real'] !== null) {
        realPelunasan = parseFloat(real['pelunasan_real']);
      }
      
      // Auto-scale old database values entered in Rp Miliar (e.g. 0.015 instead of 15000000)
      if (realPelunasan !== null && realPelunasan < 1000 && realPelunasan > 0) {
        realPelunasan = realPelunasan * 1000000000;
      }

      if (real['tunai_prr'] !== undefined && real['tunai_prr'] !== null) {
        tunaiPrr = parseFloat(real['tunai_prr']);
        if (tunaiPrr < 1000 && realPelunasan !== null && realPelunasan > 1000) {
          tunaiPrr = tunaiPrr * 1000000000;
        }
      }

      if (real['cicil_prr'] !== undefined && real['cicil_prr'] !== null) {
        cicilPrr = parseFloat(real['cicil_prr']);
        if (cicilPrr < 1000 && realPelunasan !== null && realPelunasan > 1000) {
          cicilPrr = cicilPrr * 1000000000;
        }
      }

      if (real['ts_prabayar'] !== undefined && real['ts_prabayar'] !== null) {
        tsPrabayar = parseFloat(real['ts_prabayar']);
        if (tsPrabayar < 1000 && realPelunasan !== null && realPelunasan > 1000) {
          tsPrabayar = tsPrabayar * 1000000000;
        }
      }
    }

    const realPenghapusan = penghapusanMap[m] !== undefined && penghapusanMap[m] > 0
      ? penghapusanMap[m]
      : (real && (real['penghapusan_prr'] !== undefined || real['penghapusan_real'] !== undefined)
          ? parseFloat(real['penghapusan_prr'] ?? real['penghapusan_real'])
          : null);
    
    // Saldo Akhir realisations
    let realSaldoAkhir = null;
    let palTotal = null;
    let tsTotal = null;
    if (real) {
      if (real['tindak_lanjut_lbkb'] !== undefined && real['tindak_lanjut_lbkb'] !== null) {
        realSaldoAkhir = parseFloat(real['tindak_lanjut_lbkb']);
      } else if (real['saldo_akhir_real'] !== undefined && real['saldo_akhir_real'] !== null) {
        realSaldoAkhir = parseFloat(real['saldo_akhir_real']);
      }
      
      if (realSaldoAkhir !== null && realSaldoAkhir < 1000 && realSaldoAkhir > 0) {
        realSaldoAkhir = realSaldoAkhir * 1000000000;
      }
      
      if (real['pal_total'] !== undefined && real['pal_total'] !== null) {
        palTotal = parseFloat(real['pal_total']);
        if (palTotal < 1000 && realSaldoAkhir !== null && realSaldoAkhir > 1000) {
          palTotal = palTotal * 1000000000;
        }
      }

      if (real['ts_total'] !== undefined && real['ts_total'] !== null) {
        tsTotal = parseFloat(real['ts_total']);
        if (tsTotal < 1000 && realSaldoAkhir !== null && realSaldoAkhir > 1000) {
          tsTotal = tsTotal * 1000000000;
        }
      }
    }

    janToDecRows.push({
      bulan: m,
      label: MONTHS_SHORT[m],
      
      pelunasan_target: tgtPelunasan,
      pelunasan_real: realPelunasan,
      tunai_prr: tunaiPrr,
      cicil_prr: cicilPrr,
      ts_prabayar: tsPrabayar,

      penghapusan_target: tgtPenghapusan,
      penghapusan_real: realPenghapusan,

      saldo_akhir_target: tgtSaldoAkhir,
      saldo_akhir_real: realSaldoAkhir,
      pal_total: palTotal,
      ts_total: tsTotal,

      _hasData: !!real || (penghapusanMap[m] !== undefined && penghapusanMap[m] > 0),
      penghapusan_details: penghapusanDetailsMap[m] || [],
    });
  }

  // Combine rows
  const rows = [baselineRow, ...janToDecRows];

  // Calculate cumulative values
  let cumPelunasanTgt = 0, cumPelunasanReal = 0;
  let cumTunaiPrr = 0, cumCicilPrr = 0, cumTsPrabayar = 0;
  let cumPenghapusanTgt = 0, cumPenghapusanReal = 0;
  
  let sumSaldo = 0;
  let countSaldo = 0;

  rows.forEach(r => {
    if (r.isBaseline) {
      r.rata_rata_saldo = r.saldo_akhir_real;
      r.saldo_akhir_ach = null;
      if (r.saldo_akhir_real !== null) {
        sumSaldo += r.saldo_akhir_real;
        countSaldo += 1;
      }
      return;
    }

    cumPelunasanTgt += r.pelunasan_target;
    if (r.pelunasan_real !== null) cumPelunasanReal += r.pelunasan_real;
    if (r.tunai_prr !== null) cumTunaiPrr += r.tunai_prr;
    if (r.cicil_prr !== null) cumCicilPrr += r.cicil_prr;
    if (r.ts_prabayar !== null) cumTsPrabayar += r.ts_prabayar;

    cumPenghapusanTgt += r.penghapusan_target;
    if (r.penghapusan_real !== null) cumPenghapusanReal += r.penghapusan_real;

    r.c_pelunasan_target = cumPelunasanTgt;
    r.c_pelunasan_real = r.pelunasan_real !== null ? cumPelunasanReal : null;
    r.c_tunai_prr = r.tunai_prr !== null ? cumTunaiPrr : null;
    r.c_cicil_prr = r.cicil_prr !== null ? cumCicilPrr : null;
    r.c_ts_prabayar = r.ts_prabayar !== null ? cumTsPrabayar : null;

    r.c_penghapusan_target = cumPenghapusanTgt;
    r.c_penghapusan_real = r.penghapusan_real !== null ? cumPenghapusanReal : null;

    if (r.saldo_akhir_real !== null) {
      sumSaldo += r.saldo_akhir_real;
      countSaldo += 1;
      const avg = sumSaldo / countSaldo;
      r.rata_rata_saldo = avg;
      r.saldo_akhir_ach = (r.saldo_akhir_target > 0) ? (2 - avg / r.saldo_akhir_target) * 100 : null;
    } else {
      r.rata_rata_saldo = countSaldo > 0 ? (sumSaldo / countSaldo) : null;
      r.saldo_akhir_ach = null;
    }
  });

  return rows;
}
