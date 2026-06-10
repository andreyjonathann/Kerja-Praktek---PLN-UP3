import React, { useState, useEffect } from 'react';
import { fetchSpreadsheetData } from '@/services/googleSheetsService';

export default function SpreadsheetWidget({ csvUrl, title = 'Spreadsheet Data' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!csvUrl) return;
    
    setLoading(true);
    fetchSpreadsheetData(csvUrl)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching spreadsheet data:', err);
        setError('Gagal memuat data dari Spreadsheet. Pastikan link CSV benar dan Spreadsheet telah dipublikasikan untuk umum.');
        setLoading(false);
      });
  }, [csvUrl]);

  if (!csvUrl) {
    return <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500">Silakan masukkan link CSV Spreadsheet.</div>
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data dari Google Sheets...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800/50">{error}</div>
  }

  if (data.length === 0) {
    return <div className="p-4 text-center text-slate-500">Data kosong.</div>
  }

  // Generate table headers from the keys of the first row
  const headers = Object.keys(data[0]);

  return (
    <div className="card w-full overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">Data sinkronisasi langsung (real-time saat direfresh)</p>
      </div>
      
      <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 shadow-sm z-10">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                {headers.map((header, colIdx) => (
                  <td key={colIdx} className="p-4 text-[15px] font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
