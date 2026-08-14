import ExcelJS from 'exceljs';

const kpiConfig = {
  saidi: {
    unit: 'Menit/Plgn',
    monthlyTargetKey: 'target',
    monthlyRealKey: 'realisasi',
    cumTargetKey: 'cumulativeTgt',
    cumRealKey: 'cumulativeReal',
    detailHeaders: ["Bulan", "Tidak Terencana", "Terencana", "Bencana Alam", "Transmisi", "Pembangkit", "Total Realisasi"],
    detailKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam', 'transmisi', 'pembangkit', 'realisasi'],
    format: "0.0000",
    isInverse: true
  },
  saifi: {
    unit: 'Kali/Plgn',
    monthlyTargetKey: 'target',
    monthlyRealKey: 'realisasi',
    cumTargetKey: 'cumulativeTgt',
    cumRealKey: 'cumulativeReal',
    detailHeaders: ["Bulan", "Tidak Terencana", "Terencana", "Bencana Alam", "Transmisi", "Pembangkit", "Total Realisasi"],
    detailKeys: ['distribusi_padam_tidak_terencana', 'distribusi_padam_terencana', 'distribusi_bencana_alam', 'transmisi', 'pembangkit', 'realisasi'],
    format: "0.0000",
    isInverse: true
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
  },
  pelunasan_prr: {
    unit: 'Rp',
    monthlyTargetKey: 'pelunasan_target',
    monthlyRealKey: 'pelunasan_real',
    cumTargetKey: 'c_pelunasan_target',
    cumRealKey: 'c_pelunasan_real',
    detailHeaders: ["Bulan", "Target (Rp)", "Tunai PRR (Rp)", "Cicil PRR (Rp)", "TS Prabayar (Rp)", "Total Realisasi (Rp)"],
    detailKeys: ['pelunasan_target', 'tunai_prr', 'cicil_prr', 'ts_prabayar', 'pelunasan_real'],
    format: "#,##0"
  },
  penghapusan_prr: {
    unit: 'Rp M',
    monthlyTargetKey: 'penghapusan_target',
    monthlyRealKey: 'penghapusan_real',
    cumTargetKey: 'c_penghapusan_target',
    cumRealKey: 'c_penghapusan_real',
    detailHeaders: ["Bulan", "Target (Rp Miliar)", "Realisasi (Rp Miliar)"],
    detailKeys: ['penghapusan_target', 'penghapusan_real'],
    format: "#,##0.00"
  },
  saldo_akhir: {
    unit: 'Rp',
    monthlyTargetKey: 'saldo_akhir_target',
    monthlyRealKey: 'saldo_akhir_real',
    cumTargetKey: 'saldo_akhir_target',
    cumRealKey: 'rata_rata_saldo',
    detailHeaders: ["Bulan", "Target (Rp)", "PAL (Rp)", "TS (Rp)", "Realisasi Saldo Akhir (Rp)", "Rata-rata Saldo (Rp)"],
    detailKeys: ['saldo_akhir_target', 'pal_total', 'ts_total', 'saldo_akhir_real', 'rata_rata_saldo'],
    format: "#,##0",
    isMinimize: true
  }
};

export const exportToExcel = async (kpiType, startYear, endYear, dataMap, base64Image = null) => {
  const workbook = new ExcelJS.Workbook();
  const wsData = workbook.addWorksheet(`Data ${kpiType}`);

  // Ensure grid lines are visible
  wsData.views = [{ showGridLines: true }];

  const typeKey = kpiType.toLowerCase().replace(/ /g, '_');
  const cfg = kpiConfig[typeKey] || kpiConfig.saidi;

  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  // Common styling helper functions
  const styleHeader = (row, startCol, endCol) => {
    row.height = 28;
    for (let c = startCol; c <= endCol; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00A2B9' } // PLN Teal
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    }
    row.commit();
  };

  const styleDataRow = (row, startCol, endCol, isEven, alignMap = {}) => {
    row.height = 20;
    const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Zebra striping
    for (let c = startCol; c <= endCol; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
      const align = alignMap[c] || (c === 1 ? 'left' : 'right');
      cell.alignment = { vertical: 'middle', horizontal: align };
    }
    row.commit();
  };

  // Penunjuk baris saat ini
  let rNum = 1;

  // ── 1. TABEL AKUMULASI ───────────────────────────────────────────────────────
  const sectionTitle1 = wsData.getCell(`A${rNum}`);
  sectionTitle1.value = `${endYear} Akumulasi (${cfg.unit})`;
  sectionTitle1.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
  wsData.getRow(rNum).height = 24;
  rNum++;

  const headerRow1 = wsData.getRow(rNum);
  headerRow1.getCell(1).value = 'Bulan';
  years.forEach((y, idx) => {
    headerRow1.getCell(idx + 2).value = y;
  });
  headerRow1.getCell(years.length + 2).value = 'Target';
  headerRow1.getCell(years.length + 3).value = 'Pencapaian';
  
  const lastColIdx = years.length + 3;
  styleHeader(headerRow1, 1, lastColIdx);
  rNum++;

  const monthLabels = [
    "s.d. Jan", "s.d. Feb", "s.d. Mar", "s.d. Apr", 
    "s.d. Mei", "s.d. Jun", "s.d. Jul", "s.d. Agu", 
    "s.d. Sep", "s.d. Okt", "s.d. Nov", "s.d. Des"
  ];

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const dataRow = wsData.getRow(rNum);
    const targetBulan = monthIdx + 1;

    dataRow.getCell(1).value = monthLabels[monthIdx];

    // Data kumulatif per tahun
    years.forEach((y, idx) => {
      const monthData = dataMap[y] ? dataMap[y].find(d => parseInt(d.bulan) === targetBulan) : null;
      const val = monthData ? (monthData[cfg.cumRealKey] ?? monthData[cfg.monthlyRealKey] ?? 0) : "";
      const cell = dataRow.getCell(idx + 2);
      cell.value = val !== "" ? Number(val) : "";
      if (val !== "") cell.numFmt = cfg.format || "0.0000";
    });

    // Target
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const target = endYearData ? (endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? 0) : "";
    const targetCell = dataRow.getCell(years.length + 2);
    targetCell.value = target !== "" ? Number(target) : "";
    if (target !== "") targetCell.numFmt = cfg.format || "0.0000";

    // Pencapaian
    let pencapaian = "";
    if (endYearData) {
      const real = endYearData[cfg.cumRealKey] ?? endYearData[cfg.monthlyRealKey] ?? 0;
      const tgt = endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? 0;
      if (tgt > 0) {
        if (cfg.isInverse) {
          pencapaian = real > 0 ? (tgt / real) : 0;
        } else if (cfg.isMinimize) {
          pencapaian = 2 - (real / tgt);
        } else {
          pencapaian = real / tgt;
        }
      }
    }
    const achCell = dataRow.getCell(years.length + 3);
    achCell.value = pencapaian !== "" ? Number(pencapaian) : "";
    if (pencapaian !== "") achCell.numFmt = "0.00%";

    styleDataRow(dataRow, 1, lastColIdx, monthIdx % 2 === 0);
    rNum++;
  }

  rNum += 2; // spasi kosong

  // ── 2. TABEL BULANAN ─────────────────────────────────────────────────────────
  const sectionTitle2 = wsData.getCell(`A${rNum}`);
  sectionTitle2.value = `${endYear} Bulanan (${cfg.unit})`;
  sectionTitle2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
  wsData.getRow(rNum).height = 24;
  rNum++;

  const headerRow2 = wsData.getRow(rNum);
  headerRow2.getCell(1).value = 'Bulan';
  headerRow2.getCell(2).value = `${kpiType.toUpperCase()} Bulanan`;
  styleHeader(headerRow2, 1, 2);
  rNum++;

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const dataRow = wsData.getRow(rNum);
    const targetBulan = monthIdx + 1;

    dataRow.getCell(1).value = monthLabels[monthIdx];
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const val = endYearData ? (endYearData[cfg.monthlyRealKey] ?? 0) : "";
    
    const valCell = dataRow.getCell(2);
    valCell.value = val !== "" ? Number(val) : "";
    if (val !== "") valCell.numFmt = cfg.format || "0.0000";

    styleDataRow(dataRow, 1, 2, monthIdx % 2 === 0);
    rNum++;
  }

  rNum += 2; // spasi kosong

  // ── 3. DETAIL BREAKDOWN KOMPONEN ────────────────────────────────────────────
  const sectionTitle3 = wsData.getCell(`A${rNum}`);
  sectionTitle3.value = `${endYear} Detail Komponen Input`;
  sectionTitle3.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
  wsData.getRow(rNum).height = 24;
  rNum++;

  const headerRow3 = wsData.getRow(rNum);
  cfg.detailHeaders.forEach((dh, idx) => {
    headerRow3.getCell(idx + 1).value = dh;
  });
  styleHeader(headerRow3, 1, cfg.detailHeaders.length);
  rNum++;

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const dataRow = wsData.getRow(rNum);
    const targetBulan = monthIdx + 1;
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;

    dataRow.getCell(1).value = monthLabels[monthIdx];

    cfg.detailKeys.forEach((key, idx) => {
      const val = endYearData ? endYearData[key] : "";
      const valCell = dataRow.getCell(idx + 2);
      valCell.value = val !== "" && val !== null ? Number(val) : "";
      if (val !== "" && val !== null) valCell.numFmt = cfg.format || "#,##0.00";
    });

    styleDataRow(dataRow, 1, cfg.detailHeaders.length, monthIdx % 2 === 0);
    rNum++;
  }

  // Set lebar kolom otomatis berdasarkan panjang data
  for (let colIdx = 1; colIdx <= Math.max(lastColIdx, cfg.detailHeaders.length); colIdx++) {
    let maxLen = 12;
    // Inspect headers
    const cellH1 = headerRow1.getCell(colIdx).value;
    const cellH3 = headerRow3.getCell(colIdx).value;
    if (cellH1) maxLen = Math.max(maxLen, String(cellH1).length);
    if (cellH3) maxLen = Math.max(maxLen, String(cellH3).length);
    
    wsData.getColumn(colIdx).width = maxLen + 6;
  }

  // ── 4. Sematkan Gambar Grafik ke Sheet Kedua ─────────────────────────────
  if (base64Image) {
    try {
      const wsChart = workbook.addWorksheet('Grafik');
      const imageId = workbook.addImage({
        base64: base64Image,
        extension: 'png',
      });
      wsChart.addImage(imageId, {
        tl: { col: 1, row: 1 },
        ext: { width: 900, height: 450 }
      });
    } catch (err) {
      console.warn('[excelExport] Gagal menyematkan grafik ke Excel:', err);
    }
  }

  // ── 5. Simpan Workbook ke File Excel ──────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Export_${kpiType}_${startYear}-${endYear}.xlsx`;
  link.click();
};