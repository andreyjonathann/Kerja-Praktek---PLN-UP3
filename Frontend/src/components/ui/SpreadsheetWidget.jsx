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
    return (
      <div style={{
        padding: 24,
        border: '1.5px dashed var(--border-strong)',
        borderRadius: 12,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
      }}>
        Silakan masukkan link CSV Spreadsheet.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: 32,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
      }} className="animate-pulse">
        Memuat data dari Google Sheets...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 16,
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        color: 'var(--danger)',
        borderRadius: 10,
        fontSize: '0.8125rem'
      }}>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
      }}>
        Data kosong.
      </div>
    );
  }

  // Generate table headers from the keys of the first row
  const headers = Object.keys(data[0]);

  return (
    <div className="card w-full overflow-hidden">
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,76,215,0.015)'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Data sinkronisasi langsung (real-time saat direfresh)
        </p>
      </div>
      
      <div className="table-wrapper" style={{ maxHeight: 600, overflowY: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} style={{ whiteSpace: 'nowrap' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((header, colIdx) => (
                  <td key={colIdx} style={{ whiteSpace: 'nowrap' }}>
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
