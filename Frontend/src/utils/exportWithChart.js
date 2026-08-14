import ExcelJS from 'exceljs';
import { toPng } from 'html-to-image';

/**
 * Export data tabel ke Excel (.xlsx) beserta gambar grafik disematkan langsung di sheet 'Grafik'.
 *
 * @param {object}   opts
 * @param {Array}    opts.data        - Array of objects (baris data tabel)
 * @param {string}   opts.filename    - Nama file output (tanpa ekstensi)
 * @param {Array}    opts.columns     - Konfigurasi kolom: [{ header: 'Bulan', key: 'bulan' }, ...]
 * @param {string}   [opts.sheetName] - Nama sheet data (default: 'Data')
 * @param {object}   [opts.chartRef]  - React ref ke DOM element chart untuk capture gambar
 * @param {string}   [opts.title]     - Judul baris pertama di sheet data
 */
export const exportWithChart = async ({
  data = [],
  filename = 'Export_Data',
  columns = [],
  sheetName = 'Data',
  chartRef = null,
  title = null,
}) => {
  const workbook = new ExcelJS.Workbook();
  const wsData = workbook.addWorksheet(sheetName);

  // ── 1. Populasikan Data Sheet ──────────────────────────────────────────────
  let currentRow = 1;
  
  // Set sheet view to show gridlines
  wsData.views = [
    { showGridLines: true }
  ];

  if (title) {
    const lastColLetter = String.fromCharCode(64 + columns.length);
    wsData.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = wsData.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    wsData.getRow(1).height = 35;
    currentRow = 3; // Beri spasi kosong
  }

  // Row header
  const headerRow = wsData.getRow(currentRow);
  headerRow.height = 28;
  columns.forEach((c, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = c.header;
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
  });
  headerRow.commit();
  currentRow++;

  // Data rows
  data.forEach((row, rIdx) => {
    const dataRow = wsData.getRow(currentRow);
    dataRow.height = 20;
    
    // Zebra striping color
    const isEven = rIdx % 2 === 0;
    const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    columns.forEach((c, idx) => {
      const cell = dataRow.getCell(idx + 1);
      const v = row[c.key];
      
      // Determine numeric or string values
      if (v !== null && v !== undefined && v !== '' && !isNaN(v) && typeof v !== 'boolean') {
        cell.value = Number(v);
        // Custom formatting
        if (c.header.toLowerCase().includes('persen') || c.header.toLowerCase().includes('%') || c.header.toLowerCase().includes('pencapaian')) {
          cell.numFmt = '0.00%';
        } else if (c.header.toLowerCase().includes('rp') || c.header.toLowerCase().includes('kontrak') || c.header.toLowerCase().includes('rab')) {
          cell.numFmt = '#,##0';
        } else {
          cell.numFmt = '#,##0.00';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v != null ? v : '';
        // Alignments based on column type
        if (c.key.toLowerCase().includes('bulan') || c.key.toLowerCase().includes('tanggal') || c.key.toLowerCase().includes('name') || c.key.toLowerCase().includes('label')) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else if (c.key.toLowerCase().includes('status') || c.key.toLowerCase().includes('code')) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }

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
    });
    dataRow.commit();
    currentRow++;
  });

  // Sesuaikan lebar kolom otomatis
  columns.forEach((c, idx) => {
    let maxLen = c.header.length;
    data.forEach(row => {
      const val = String(row[c.key] ?? '');
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    });
    wsData.getColumn(idx + 1).width = Math.min(maxLen + 6, 35);
  });

  // ── 2. Tangkap & Sematkan Grafik (jika chartRef tersedia) ─────────────────
  if (chartRef && chartRef.current) {
    try {
      const imgDataUrl = await toPng(chartRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Tambahkan sheet khusus untuk grafik
      const wsChart = workbook.addWorksheet('Grafik');

      // Daftarkan base64 image ke workbook
      const imageId = workbook.addImage({
        base64: imgDataUrl,
        extension: 'png',
      });

      // Tempatkan gambar grafik mulai dari sel B2 (kolom 1, baris 1 adalah 0-indexed)
      wsChart.addImage(imageId, {
        tl: { col: 1, row: 1 },
        ext: { width: 900, height: 450 }
      });
      
    } catch (err) {
      console.warn('[exportWithChart] Gagal capture atau sematkan grafik:', err);
    }
  }

  // ── 3. Unduh Workbook Excel ───────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
};

/**
 * Shorthand: export data sederhana tanpa chart (backward-compatible dengan exportToExcel lama)
 */
export const exportToExcel = async (data, filename = 'Data_Export') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk di-export.');
    return;
  }
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers).font = { bold: true };
    data.forEach(row => {
      worksheet.addRow(headers.map(h => row[h]));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
};
