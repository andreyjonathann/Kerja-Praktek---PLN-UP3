import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

const monthLabels = [
  "s.d. Jan", "s.d. Feb", "s.d. Mar", "s.d. Apr",
  "s.d. Mei", "s.d. Jun", "s.d. Jul", "s.d. Agu",
  "s.d. Sep", "s.d. Okt", "s.d. Nov", "s.d. Des"
];

// Helper: style a header row with blue background
function styleHeaderRow(row, numCols) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E6FBB' } };
  row.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = 20;
  for (let c = 1; c <= numCols; c++) {
    const cell = row.getCell(c);
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  }
}

// Helper: style a title row
function styleTitleRow(row, numCols, worksheet) {
  worksheet.mergeCells(row.number, 1, row.number, numCols);
  row.font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
  row.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = 22;
}

export const exportToExcel = async (kpiType, startYear, endYear, dataMap, chartBase64 = null, breakdownBase64 = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PLN UP3 System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Data ${kpiType}`);

  const typeKey = kpiType.toLowerCase().replace(/ /g, '_');
  const cfg = kpiConfig[typeKey] || kpiConfig.saidi;

  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const totalCols = years.length + 3; // Bulan + years + Target + Pencapaian

  // Set column widths
  worksheet.columns = [
    { width: 14 },
    ...years.map(() => ({ width: 13 })),
    { width: 13 },
    { width: 13 },
  ];

  // ========== TABLE 1: AKUMULASI ==========
  let titleRow1 = worksheet.addRow([`${endYear} Akumulasi — ${kpiType.toUpperCase()}`]);
  styleTitleRow(titleRow1, totalCols, worksheet);

  let headerRow1 = worksheet.addRow(["", ...years, "Target", "Pencapaian"]);
  styleHeaderRow(headerRow1, totalCols);

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const bulanNum = monthIdx + 1;
    const row = [monthLabels[monthIdx]];

    years.forEach(y => {
      const monthData = dataMap[y]?.find(d => parseInt(d.bulan) === bulanNum);
      row.push(monthData ? (monthData[cfg.cumRealKey] ?? monthData[cfg.monthlyRealKey] ?? '') : '');
    });

    const endYearData = dataMap[endYear]?.find(d => parseInt(d.bulan) === bulanNum);
    const target = endYearData ? (endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? '') : '';
    let pencapaian = '';
    if (endYearData) {
      const real = endYearData[cfg.cumRealKey] ?? endYearData[cfg.monthlyRealKey] ?? 0;
      const tgt = endYearData[cfg.cumTargetKey] ?? endYearData[cfg.monthlyTargetKey] ?? 0;
      if (tgt > 0) {
        pencapaian = cfg.isInverse ? (real > 0 ? tgt / real : 0)
          : cfg.isMinimize ? 2 - real / tgt
          : real / tgt;
      }
    }

    const dataRow = worksheet.addRow([...row, target, pencapaian]);
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dataRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: monthIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF0F7FF' } };
      cell.border = { bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    });
  }

  worksheet.addRow([]);
  worksheet.addRow([]);

  // ========== TABLE 2: BULANAN ==========
  let titleRow2 = worksheet.addRow([`${endYear} Bulanan — ${kpiType.toUpperCase()} (${cfg.unit})`]);
  styleTitleRow(titleRow2, 2, worksheet);

  let headerRow2 = worksheet.addRow(["Bulan", `${kpiType.toUpperCase()} Bulanan (${cfg.unit})`]);
  styleHeaderRow(headerRow2, 2);

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const bulanNum = monthIdx + 1;
    const endYearData = dataMap[endYear]?.find(d => parseInt(d.bulan) === bulanNum);
    const val = endYearData ? (endYearData[cfg.monthlyRealKey] ?? '') : '';
    const dataRow = worksheet.addRow([monthLabels[monthIdx], val]);
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dataRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: monthIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF0F7FF' } };
      cell.border = { bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    });
  }

  worksheet.addRow([]);
  worksheet.addRow([]);

  // ========== TABLE 3: DETAIL KOMPONEN ==========
  const detailCols = cfg.detailHeaders.length;
  let titleRow3 = worksheet.addRow([`${endYear} Detail Komponen Input`]);
  styleTitleRow(titleRow3, detailCols, worksheet);

  let headerRow3 = worksheet.addRow(cfg.detailHeaders);
  styleHeaderRow(headerRow3, detailCols);

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const bulanNum = monthIdx + 1;
    const endYearData = dataMap[endYear]?.find(d => parseInt(d.bulan) === bulanNum);
    const row = [monthLabels[monthIdx], ...cfg.detailKeys.map(k => endYearData ? (endYearData[k] ?? '') : '')];
    const dataRow = worksheet.addRow(row);
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dataRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: monthIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF0F7FF' } };
      cell.border = { bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    });
  }

  // ========== CHART IMAGES ==========
  if (chartBase64 || breakdownBase64) {
    worksheet.addRow([]);
    worksheet.addRow([]);

    let currentIdx = worksheet.rowCount + 1;

    if (chartBase64) {
      const labelRow = worksheet.getRow(currentIdx);
      labelRow.getCell(1).value = '📊 Grafik Tren ' + kpiType.toUpperCase();
      labelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } };
      labelRow.height = 20;

      const rawBase64 = chartBase64.includes(',') ? chartBase64.split(',')[1] : chartBase64;
      try {
        const imageId = workbook.addImage({ base64: rawBase64, extension: 'png' });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: currentIdx + 1 },
          ext: { width: 850, height: 350 }
        });
        currentIdx += 20; // Move down for the next chart
      } catch (e) {
        console.error('Gagal menyisipkan grafik utama:', e);
      }
    }

    if (breakdownBase64) {
      if (chartBase64) currentIdx += 2; // Add some gap
      const labelRow = worksheet.getRow(currentIdx);
      labelRow.getCell(1).value = '📊 Grafik Breakdown Penyebab ' + kpiType.toUpperCase();
      labelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } };
      labelRow.height = 20;

      const rawBase64 = breakdownBase64.includes(',') ? breakdownBase64.split(',')[1] : breakdownBase64;
      try {
        const imageId = workbook.addImage({ base64: rawBase64, extension: 'png' });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: currentIdx + 1 },
          ext: { width: 850, height: 350 }
        });
      } catch (e) {
        console.error('Gagal menyisipkan grafik breakdown:', e);
      }
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `Export_${kpiType}_${startYear}-${endYear}.xlsx`);
};
