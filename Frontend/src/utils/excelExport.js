import * as XLSX from 'xlsx';

export const exportToExcel = (kpiType, startYear, endYear, dataMap) => {
  const wb = XLSX.utils.book_new();
  
  // Prepare data rows
  const wsData = [];
  
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
      const val = monthData ? (monthData.cumulativeReal ?? monthData.realisasi ?? 0) : "";
      row.push(val);
    });
    
    // Add Target and Pencapaian for endYear
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const target = endYearData ? (endYearData.cumulativeTgt ?? endYearData.target ?? 0) : "";
    
    let pencapaian = "";
    if (endYearData) {
      const real = endYearData.cumulativeReal ?? endYearData.realisasi ?? 0;
      const tgt = endYearData.cumulativeTgt ?? endYearData.target ?? 0;
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
  
  const unit = kpiType.toUpperCase() === 'SAIDI' ? 'Menit/Plgn' : 'Kali/Plgn';
  const headerRow2 = ["", `${kpiType.toUpperCase()} Bulanan (${unit})`];
  wsData.push(headerRow2);
  
  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const row = [monthLabels[monthIdx]];
    const targetBulan = monthIdx + 1;
    
    // Add cumulative value for endYear (Based on the reference image, the monthly chart actually plots the cumulative data)
    const endYearData = dataMap[endYear] ? dataMap[endYear].find(d => parseInt(d.bulan) === targetBulan) : null;
    const val = endYearData ? (endYearData.cumulativeReal ?? endYearData.realisasi ?? 0) : "";
    
    row.push(val);
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
