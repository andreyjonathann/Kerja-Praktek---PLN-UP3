import * as XLSX from 'xlsx';

/**
 * Menerima data array of object dan nama file,
 * lalu men-download file Excel (.xlsx)
 */
export const exportToExcel = (data, filename = 'Data_Export') => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk di-export.");
    return;
  }

  // Buat worksheet dari JSON
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Buat workbook dan tambahkan worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  // Export file
  XLSX.writeFile(workbook, `\${filename}.xlsx`);
};
