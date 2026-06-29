import * as XLSX from 'xlsx';

const kpiConfig = {
  saidi: {
    unit: 'Menit/Plgn',
    monthlyTargetKey: 'target',
    monthlyRealKey: 'realisasi',
    cumTargetKey: 'cumulativeTgt',
    cumRealKey: 'cumulativeReal',
    detailHeaders: ["Bulan", "Tidak Terencana", "Terencana", "Bencana Alam", "Transmisi", "Pembangkit", "Total Realisasi"],
    detailKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam', 'transmisi', 'pembangkit', 'realisasi']
  },
  saifi: {
    unit: 'Kali/Plgn',
    monthlyTargetKey: 'target',
    monthlyRealKey: 'realisasi',
    cumTargetKey: 'cumulativeTgt',
    cumRealKey: 'cumulativeReal',
    detailHeaders: ["Bulan", "Tidak Terencana", "Terencana", "Bencana Alam", "Transmisi", "Pembangkit", "Total Realisasi"],
    detailKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam', 'transmisi', 'pembangkit', 'realisasi']
  },
  penjualan: {
    unit: 'kWh',
    monthlyTargetKey: 'penjualan_target',
    monthlyRealKey: 'penjualan_total',
    cumTargetKey: 'c_penjualan_target',
    cumRealKey: 'c_penjualan_total',
    detailHeaders: ["Bulan", "S - Sosial", "R - Rumah Tangga", "B - Bisnis", "I - Industri", "P - Pemerintah", "T - Traksi", "L - Layanan Khusus", "C - Curah", "Total Realisasi"],
    detailKeys: ['penjualan_s', 'penjualan_r', 'penjualan_b', 'penjualan_i', 'penjualan_p', 'penjualan_t', 'penjualan_l', 'penjualan_c', 'penjualan_total']
  },
  pelanggan: {
    unit: 'Pelanggan',
    monthlyTargetKey: 'pelanggan_target',
    monthlyRealKey: 'pelanggan_total',
    cumTargetKey: 'c_pelanggan_target',
    cumRealKey: 'c_pelanggan_total',
    detailHeaders: ["Bulan", "S - Sosial", "R - Rumah Tangga", "B - Bisnis", "I - Industri", "P - Pemerintah", "T - Traksi", "L - Layanan Khusus", "C - Curah", "Total Realisasi"],
    detailKeys: ['pelanggan_s', 'pelanggan_r', 'pelanggan_b', 'pelanggan_i', 'pelanggan_p', 'pelanggan_t', 'pelanggan_l', 'pelanggan_c', 'pelanggan_total']
  },
  daya_tersambung: {
    unit: 'VA',
    monthlyTargetKey: 'daya_target',
    monthlyRealKey: 'daya_total',
    cumTargetKey: 'c_daya_target',
    cumRealKey: 'c_daya_total',
    detailHeaders: ["Bulan", "S - Sosial", "R - Rumah Tangga", "B - Bisnis", "I - Industri", "P - Pemerintah", "T - Traksi", "L - Layanan Khusus", "C - Curah", "Total Realisasi"],
    detailKeys: ['daya_s', 'daya_r', 'daya_b', 'daya_i', 'daya_p', 'daya_t', 'daya_l', 'daya_c', 'daya_total']
  },
  daya: {
    unit: 'VA',
    monthlyTargetKey: 'daya_target',
    monthlyRealKey: 'daya_total',
    cumTargetKey: 'c_daya_target',
    cumRealKey: 'c_daya_total',
    detailHeaders: ["Bulan", "S - Sosial", "R - Rumah Tangga", "B - Bisnis", "I - Industri", "P - Pemerintah", "T - Traksi", "L - Layanan Khusus", "C - Curah", "Total Realisasi"],
    detailKeys: ['daya_s', 'daya_r', 'daya_b', 'daya_i', 'daya_p', 'daya_t', 'daya_l', 'daya_c', 'daya_total']
  },
  pendapatan_bp: {
    unit: 'Juta Rp',
    monthlyTargetKey: 'pendapatan_target',
    monthlyRealKey: 'pendapatan_total',
    cumTargetKey: 'c_pendapatan_target',
    cumRealKey: 'c_pendapatan_total',
    detailHeaders: ["Bulan", "PB - Pasang Baru", "TD - Multi Guna", "Total Pendapatan BP"],
    detailKeys: ['pendapatan_pb', 'pendapatan_td', 'pendapatan_total']
  },
  pendapatan: {
    unit: 'Juta Rp',
    monthlyTargetKey: 'pendapatan_target',
    monthlyRealKey: 'pendapatan_total',
    cumTargetKey: 'c_pendapatan_target',
    cumRealKey: 'c_pendapatan_total',
    detailHeaders: ["Bulan", "PB - Pasang Baru", "TD - Multi Guna", "Total Pendapatan BP"],
    detailKeys: ['pendapatan_pb', 'pendapatan_td', 'pendapatan_total']
  },
  pln_mobile: {
    unit: 'Transaksi',
    monthlyTargetKey: 'pln_mobile_transaksi_target',
    monthlyRealKey: 'pln_mobile_transaksi',
    cumTargetKey: 'c_pln_mobile_transaksi_target',
    cumRealKey: 'c_pln_mobile_transaksi',
    detailHeaders: ["Bulan", "Pengguna Aktif", "Jumlah Transaksi", "Nilai Transaksi (Juta Rp)"],
    detailKeys: ['pln_mobile_pengguna', 'pln_mobile_transaksi', 'pln_mobile_nilai']
  }
};

export const exportToExcel = (kpiType, startYear, endYear, dataMap) => {
  const wb = XLSX.utils.book_new();
  
  // Prepare data rows
  const wsData = [];
  const typeKey = kpiType.toLowerCase().replace(/ /g, '_');
  const cfg = kpiConfig[typeKey] || kpiConfig.saidi;
  
  // ========== TABLE 1: AKUMULASI ==========
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }
  
  // Title Row
  const titleRow1 = [`${endYear} Akumulasi`];
  wsData.push(titleRow1);
  
  // Header Row
  const headerRow1 = [""];
  years.forEach(y => headerRow1.push(y));
  headerRow1.push("Target", "Pencapaian");
  wsData.push(headerRow1);
  
  // Data Rows
  const monthLabels = [
    "s.d. Jan", "s.d. Feb", "s.d. Mar", "s.d. Apr", 
    "s.d. Mei", "s.d. Jun", "s.d. Jul", "s.d. Agu", 
    "s.d. Sep", "s.d. Okt", "s.d. Nov", "s.d. Des"
  ];
  
  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const row = [monthLabels[monthIdx]];
    const targetBulan = monthIdx + 1;
    
    // Add cumulative value for each year
    years.forEach(y => {
      const monthData = dataMap[y] ? dataMap[y].find(d => parseInt(d.bulan) === targetBulan) : null;
      const val = monthData ? (monthData[cfg.cumRealKey] ?? monthData[cfg.monthlyRealKey] ?? 0) : "";
      row.push(val);
    });
    
    // Add Target and Pencapaian for endYear
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const target = endYearData ? (endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? 0) : "";
    
    let pencapaian = "";
    if (endYearData) {
      const real = endYearData[cfg.cumRealKey] ?? endYearData[cfg.monthlyRealKey] ?? 0;
      const tgt = endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? 0;
      if (tgt > 0) {
        // Formatted as decimal representing percentage
        pencapaian = real / tgt;
      }
    }
    
    row.push(target);
    row.push(pencapaian);
    
    wsData.push(row);
  }
  
  // Empty space
  wsData.push([]);
  wsData.push([]);
  
  // ========== TABLE 2: BULANAN ==========
  const titleRow2 = [`${endYear} Bulanan`];
  wsData.push(titleRow2);
  
  const headerRow2 = ["", `${kpiType.toUpperCase()} Bulanan (${cfg.unit})`];
  wsData.push(headerRow2);
  
  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const row = [monthLabels[monthIdx]];
    const targetBulan = monthIdx + 1;
    
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const val = endYearData ? (endYearData[cfg.monthlyRealKey] ?? 0) : "";
    
    row.push(val);
    wsData.push(row);
  }
  
  // ========== TABLE 3: BREAKDOWN KOMPONEN ==========
  wsData.push([]);
  wsData.push([]);
  wsData.push([`${endYear} Detail Komponen Input`]);
  
  wsData.push(cfg.detailHeaders);
  
  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const row = [monthLabels[monthIdx]];
    const targetBulan = monthIdx + 1;
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    
    if (endYearData) {
      cfg.detailKeys.forEach(k => {
        row.push(endYearData[k] ?? "");
      });
    } else {
      cfg.detailKeys.forEach(() => {
        row.push("");
      });
    }
    wsData.push(row);
  }
  
  // Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Number Formatting
  // Apply formats to columns B to ... depending on year span
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = {c:C, r:R};
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = ws[cellRef];
      if (!cell || cell.t !== 'n') continue;
      
      // Formatting
      if (C === years.length + 2 && R >= 2 && R <= 13) {
        // Pencapaian column (Akumulasi table)
        cell.z = "0%";
      } else {
        // Other numeric cells
        cell.z = "0.00";
      }
    }
  }
  
  // Set column widths
  const wscols = [
    { wch: 15 }, // Bulan
  ];
  for (let i = 0; i < years.length + 2; i++) {
    wscols.push({ wch: 12 });
  }
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, `Data ${kpiType}`);
  XLSX.writeFile(wb, `Export_${kpiType}_${startYear}-${endYear}.xlsx`);
};
