import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function KelolaTargetPage() {
  const { isAdmin } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    bidang: 'Jaringan',
    indikator: '',
    satuan: '',
    polaritas: 'MAXIMIZE',
    bobot: 0,
    target: 0,
    tahun: 2026
  });

  const fetchTargets = async () => {
    try {
      const res = await api.get('/targets');
      setTargets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets', formData);
      alert('Target berhasil ditambahkan');
      fetchTargets();
      setFormData({ ...formData, indikator: '', satuan: '', target: 0, bobot: 0 });
    } catch (err) {
      alert('Gagal menambah target: ' + err.message);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-slate-500">Akses ditolak. Halaman ini khusus Admin.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Kelola Target Tahunan</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-bold mb-4">Tambah Target Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Bidang</label>
            <select name="bidang" value={formData.bidang} onChange={handleChange} className="w-full p-2 border rounded-lg">
              <option value="Jaringan">Jaringan</option>
              <option value="Aset">Aset</option>
              <option value="Transaksi Energi">Transaksi Energi</option>
              <option value="Niaga">Niaga</option>
              <option value="Pemasaran">Pemasaran</option>
              <option value="Keuangan">Keuangan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Indikator KPI</label>
            <input type="text" name="indikator" value={formData.indikator} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Satuan</label>
            <input type="text" name="satuan" value={formData.satuan} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Polaritas</label>
            <select name="polaritas" value={formData.polaritas} onChange={handleChange} className="w-full p-2 border rounded-lg">
              <option value="MAXIMIZE">MAXIMIZE (Makin besar makin baik)</option>
              <option value="MINIMIZE">MINIMIZE (Makin kecil makin baik)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Bobot (%)</label>
            <input type="number" name="bobot" step="0.01" value={formData.bobot} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Target</label>
            <input type="number" name="target" step="0.0001" value={formData.target} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Tahun</label>
            <input type="number" name="tahun" value={formData.tahun} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full font-bold">Simpan Target</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Daftar Target</h2>
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-2">Bidang</th>
                <th className="py-2">Indikator</th>
                <th className="py-2">Satuan</th>
                <th className="py-2">Polaritas</th>
                <th className="py-2">Bobot</th>
                <th className="py-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 text-sm">{t.bidang}</td>
                  <td className="py-2 text-sm">{t.indikator}</td>
                  <td className="py-2 text-sm">{t.satuan}</td>
                  <td className="py-2 text-sm">
                    <span className={`text-xs px-2 py-1 rounded-full \${t.polaritas === 'MAXIMIZE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.polaritas}
                    </span>
                  </td>
                  <td className="py-2 text-sm">{t.bobot}%</td>
                  <td className="py-2 text-sm font-semibold">{t.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
