import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { AlertCircle } from 'lucide-react';

export default function KelolaJaringanPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isJaringan = user?.role === 'pic_jaringan' || user?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState('ens');

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('rekap-gangguan')) setActiveTab('gg_bulanan');
    else if (path.includes('log-histori')) setActiveTab('log_gangguan');
    else if (path.includes('ens')) setActiveTab('ens');
    else setActiveTab('ens'); // Default
  }, [location.pathname]);

  const handleTabClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };
  
  const [periodeId, setPeriodeId] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  
  const [ensForm, setEnsForm] = useState({ terencana: '', tidak_terencana: '', bencana_alam: '' });
  const [ggBulananForm, setGgBulananForm] = useState({ gt_5_menit: 0, le_5_menit: 0, berulang: 0 });
  
  const [ggList, setGgList] = useState([]);
  const [ggListForm, setGgListForm] = useState({
      tahun: 2026, bulan: 1, penyulang: '', gardu_induk: '', tanggal: '', 
      waktu_padam: '', waktu_nyala: '', lokasi: '', durasi: 0, penyebab: '', keterangan: ''
  });

  const handleEnsSubmit = async (e) => {
      e.preventDefault();
      if (!periodeId || !tahun) return alert('Pilih bulan dan tahun!');
      
      const t = parseFloat(ensForm.terencana);
      const tt = parseFloat(ensForm.tidak_terencana);
      const b = parseFloat(ensForm.bencana_alam);

      if (isNaN(t) || isNaN(tt) || isNaN(b)) return alert('Semua field ENS harus diisi dengan angka valid!');
      if (t < 0 || tt < 0 || b < 0) return alert('Nilai ENS tidak boleh negatif!');

      const monthLabel = MONTHS.find(m => m.value == periodeId)?.label || periodeId;
      
      if (!window.confirm(`Apakah Anda yakin ingin menyimpan data ENS bulan ${monthLabel} tahun ${tahun}?`)) {
          return;
      }

      try {
          await api.post('/jaringan/ens', { periode_id: periodeId, tahun, terencana: t, tidak_terencana: tt, bencana_alam: b });
          alert('Data ENS berhasil tersimpan!');
          setEnsForm({ terencana: '', tidak_terencana: '', bencana_alam: '' });
      } catch (err) { alert(err.message); }
  };

  const handleGgBulananSubmit = async (e) => {
      e.preventDefault();
      if (!periodeId || !tahun) return alert('Pilih bulan dan tahun!');
      try {
          await api.post('/jaringan/gangguan', { periode_id: periodeId, tahun, ...ggBulananForm });
          alert('Data Gangguan Bulanan tersimpan!');
      } catch (err) { alert(err.message); }
  };

  const fetchGgList = async () => {
      const res = await api.get('/jaringan/gangguan-list');
      setGgList(res.data);
  };

  useEffect(() => {
      if (activeTab === 'log_gangguan') fetchGgList();
  }, [activeTab]);

  const handleGgListSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.post('/jaringan/gangguan-list', ggListForm);
          alert('Log Gangguan tersimpan!');
          fetchGgList();
          setGgListForm({ ...ggListForm, penyulang: '', durasi: 0, penyebab: '' });
      } catch (err) { alert(err.message); }
  };

  const handleDeleteGgList = async (id) => {
      if(!window.confirm('Hapus log ini?')) return;
      await api.delete(`/jaringan/gangguan-list/${id}`);
      fetchGgList();
  };

  if (!isJaringan) {
      return <div className="p-8 text-center text-slate-500">Akses ditolak. Khusus PIC Jaringan.</div>;
  }

  const totalEnsInput = (parseFloat(ensForm.terencana) || 0) + (parseFloat(ensForm.tidak_terencana) || 0) + (parseFloat(ensForm.bencana_alam) || 0);

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Kelola Data Jaringan</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          {(activeTab === 'ens' || activeTab === 'gg_bulanan') && (
              <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold mb-2">Pilih Bulan</label>
                      <select value={periodeId} onChange={e => setPeriodeId(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50">
                          <option value="">Pilih Bulan...</option>
                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold mb-2">Pilih Tahun</label>
                      <select value={tahun} onChange={e => setTahun(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-slate-50">
                          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
              </div>
          )}

          {activeTab === 'ens' && (
              <div className="space-y-8">
                  <form onSubmit={handleEnsSubmit} className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={20} className="text-blue-600" />
                        <h2 className="font-bold text-lg text-slate-800">Input ENS (MWh)</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-slate-600">Padam Terencana</label>
                          <input type="number" step="0.001" min="0" placeholder="0.000" required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" value={ensForm.terencana} onChange={e => setEnsForm({...ensForm, terencana: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-slate-600">Tidak Terencana</label>
                          <input type="number" step="0.001" min="0" placeholder="0.000" required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" value={ensForm.tidak_terencana} onChange={e => setEnsForm({...ensForm, tidak_terencana: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-slate-600">Bencana Alam</label>
                          <input type="number" step="0.001" min="0" placeholder="0.000" required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" value={ensForm.bencana_alam} onChange={e => setEnsForm({...ensForm, bencana_alam: e.target.value})} />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                        <div>
                          <p className="text-sm font-bold text-slate-500">Total Input ENS:</p>
                          <p className="text-2xl font-extrabold text-slate-800">{totalEnsInput.toFixed(3)}</p>
                        </div>
                        <button 
                          type="submit" 
                          disabled={!periodeId || !tahun || ensForm.terencana === '' || ensForm.tidak_terencana === '' || ensForm.bencana_alam === ''}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-bold transition-colors w-full md:w-auto"
                        >
                          Simpan ENS
                        </button>
                      </div>
                  </form>
              </div>
          )}

          {activeTab === 'gg_bulanan' && (
              <form onSubmit={handleGgBulananSubmit} className="space-y-4">
                  <h2 className="font-bold text-lg">Input Rekap Gangguan (Kali)</h2>
                  <div><label>Gangguan &gt; 5 Menit</label><input type="number" className="w-full p-2 border rounded-lg" value={ggBulananForm.gt_5_menit} onChange={e => setGgBulananForm({...ggBulananForm, gt_5_menit: e.target.value})} /></div>
                  <div><label>Gangguan &le; 5 Menit</label><input type="number" className="w-full p-2 border rounded-lg" value={ggBulananForm.le_5_menit} onChange={e => setGgBulananForm({...ggBulananForm, le_5_menit: e.target.value})} /></div>
                  <div><label>Gangguan Berulang</label><input type="number" className="w-full p-2 border rounded-lg" value={ggBulananForm.berulang} onChange={e => setGgBulananForm({...ggBulananForm, berulang: e.target.value})} /></div>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold w-full">Simpan Gangguan</button>
              </form>
          )}

          {activeTab === 'log_gangguan' && (
              <div className="space-y-8">
                  <form onSubmit={handleGgListSubmit} className="grid grid-cols-2 gap-4">
                      <h2 className="col-span-2 font-bold text-lg">Tambah Log Gangguan Baru</h2>
                      <div><label>Bulan (Angka)</label><input type="number" className="w-full p-2 border rounded" value={ggListForm.bulan} onChange={e => setGgListForm({...ggListForm, bulan: e.target.value})} /></div>
                      <div><label>Penyulang</label><input type="text" className="w-full p-2 border rounded" value={ggListForm.penyulang} onChange={e => setGgListForm({...ggListForm, penyulang: e.target.value})} /></div>
                      <div><label>Gardu Induk</label><input type="text" className="w-full p-2 border rounded" value={ggListForm.gardu_induk} onChange={e => setGgListForm({...ggListForm, gardu_induk: e.target.value})} /></div>
                      <div><label>Tanggal Padam</label><input type="date" className="w-full p-2 border rounded" value={ggListForm.tanggal} onChange={e => setGgListForm({...ggListForm, tanggal: e.target.value})} /></div>
                      <div><label>Penyebab</label><input type="text" className="w-full p-2 border rounded" value={ggListForm.penyebab} onChange={e => setGgListForm({...ggListForm, penyebab: e.target.value})} /></div>
                      <div><label>Durasi (Menit)</label><input type="number" className="w-full p-2 border rounded" value={ggListForm.durasi} onChange={e => setGgListForm({...ggListForm, durasi: e.target.value})} /></div>
                      <div className="col-span-2"><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold w-full">Tambah Log</button></div>
                  </form>

                  <div>
                      <h3 className="font-bold text-md mb-2">Daftar Histori</h3>
                      <table className="w-full text-sm text-left">
                          <thead><tr className="border-b"><th className="py-2">Tgl</th><th>Penyulang</th><th>GI</th><th>Penyebab</th><th>Durasi</th><th>Aksi</th></tr></thead>
                          <tbody>
                              {ggList.map(g => (
                                  <tr key={g.id} className="border-b">
                                      <td className="py-2">{g.tanggal}</td>
                                      <td>{g.penyulang}</td>
                                      <td>{g.gardu_induk}</td>
                                      <td>{g.penyebab}</td>
                                      <td>{g.durasi} mnt</td>
                                      <td><button onClick={()=>handleDeleteGgList(g.id)} className="text-red-500 font-bold">Hapus</button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
