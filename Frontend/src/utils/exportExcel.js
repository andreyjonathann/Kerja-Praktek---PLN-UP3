import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Export data to an Excel file with an optional chart image
 * @param {Array} data - Array of objects to be exported
 * @param {String} filename - The name of the file to be saved (without .xlsx extension)
 * @param {String} chartBase64 - Base64 data URL of the chart image (optional)
 *                               Accepts both raw base64 and "data:image/png;base64,..." format
 */
export const exportToExcel = async (data, filename = 'Data_Export', chartBase64 = null) => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk di-export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PLN UP3 System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Data');

  // Extract headers
  const headers = Object.keys(data[0]);

  // Set column widths dynamically based on header length
  worksheet.columns = headers.map(h => ({
    header: '',
    width: Math.max(h.length + 4, 18)
  }));

  // Add title row (filename as title)
  const titleRow = worksheet.addRow([filename.replace(/_/g, ' ')]);
  worksheet.mergeCells(1, 1, 1, headers.length);
  titleRow.font = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 24;

  // Add header row
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E6FBB' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;

  // Add border to header
  headerRow.eachCell(cell => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E6FBB' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FF1A5C9C' } },
      right: { style: 'thin', color: { argb: 'FF1A5C9C' } },
    };
  });

  // Add data rows with alternating stripe
  data.forEach((row, idx) => {
    const dataRow = worksheet.addRow(Object.values(row));
    dataRow.alignment = { vertical: 'middle', horizontal: 'center' };
    dataRow.height = 18;
    const isStripe = idx % 2 === 1;
    dataRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isStripe ? 'FFF0F7FF' : 'FFFFFFFF' }
      };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFCFE2F3' } },
        left: { style: 'hair', color: { argb: 'FFCFE2F3' } },
        right: { style: 'hair', color: { argb: 'FFCFE2F3' } },
      };
    });
  });

  // Add chart image if provided
  if (chartBase64) {
    // Strip data URL prefix if present (html-to-image returns "data:image/png;base64,...")
    const rawBase64 = chartBase64.includes(',')
      ? chartBase64.split(',')[1]
      : chartBase64;

    try {
      const imageId = workbook.addImage({
        base64: rawBase64,
        extension: 'png',
      });

      // Place image 2 rows below the data table
      const imageStartRow = data.length + 4; // +1 title, +1 header, +data rows, +2 gap

      worksheet.addImage(imageId, {
        tl: { col: 0, row: imageStartRow },
        ext: { width: 900, height: 420 }
      });

      // Add "Grafik" label above image
      const labelRow = worksheet.getRow(imageStartRow);
      labelRow.getCell(1).value = '📊 Grafik';
      labelRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
    } catch (e) {
      console.error('Gagal menyisipkan gambar grafik:', e);
    }
  }

  // Generate and download Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `${filename}.xlsx`);
};
