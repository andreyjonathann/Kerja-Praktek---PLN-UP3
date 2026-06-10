import React, { useState } from 'react';
import SpreadsheetWidget from '@/components/ui/SpreadsheetWidget';
import { Database, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function SpreadsheetDemo() {
  // Gunakan URL CSV dari spreadsheet user
  const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vQF3eNDzC3vf9FXeLWl8quvpRk9UopQABmqH05jXu2CxMrqUvju_XYFuNUbvhpXdw/pub?output=csv');
  const [activeUrl, setActiveUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vQF3eNDzC3vf9FXeLWl8quvpRk9UopQABmqH05jXu2CxMrqUvju_XYFuNUbvhpXdw/pub?output=csv');

  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveUrl(url);
  };

  return (
    <div className="p-6 w-full space-y-6 animate-fade-in pt-4">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
          <FileSpreadsheet className="text-emerald-500" size={32} />
          Integrasi Google Spreadsheet
        </h1>
        <p className="text-base font-medium text-slate-600 dark:text-slate-300">
          Demo ini menunjukkan bagaimana data diambil langsung (live) dari Google Sheets tanpa memerlukan backend database terpisah.
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-base font-bold text-slate-700 dark:text-slate-200">
              URL CSV Spreadsheet (Publish to Web)
            </label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Masukkan link CSV Google Sheets di sini..."
              className="w-full px-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
            />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-8 h-12 text-base font-bold whitespace-nowrap transition-colors flex items-center gap-2">
            <RefreshCw size={18} />
            Tarik Data
          </button>
        </form>
        
        <div className="mt-5 p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
          <h4 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Database size={16} /> Cara Mendapatkan Link CSV
          </h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 space-y-2 ml-1">
            <li>Buka Google Spreadsheet Anda.</li>
            <li>Klik menu <strong>File</strong> &gt; <strong>Bagikan</strong> &gt; <strong>Publikasikan di web</strong>.</li>
            <li>Di tab Tautkan, pilih sheet yang diinginkan, dan ubah format "Halaman Web" menjadi <strong>Nilai yang dipisahkan koma (.csv)</strong>.</li>
            <li>Klik Publikasikan, lalu salin link yang muncul dan tempelkan di atas.</li>
          </ol>
        </div>
      </div>

      {activeUrl ? (
        <SpreadsheetWidget csvUrl={activeUrl} title="Data Live dari Spreadsheet" />
      ) : (
        <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed">
          <FileSpreadsheet size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">Klik "Tarik Data" untuk menampilkan sampel, <br/>atau masukkan link CSV Anda sendiri.</p>
        </div>
      )}
    </div>
  );
}
