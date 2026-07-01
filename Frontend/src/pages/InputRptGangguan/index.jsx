import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, ArrowLeft, Clock } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputRptGangguanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [targetMenit, setTargetMenit] = useState(30.00);

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm({
      defaultValues: {
          tahun: '',
          bulan: '',
          total_durasi_menit: '',
          jumlah_gangguan: ''
      }
  });

  const selectedYear = watch('tahun');
  const durasi = watch('total_durasi_menit');
  const gangguan = watch('jumlah_gangguan');

  useEffect(() => {
    if (!selectedYear) return;
    const checkTarget = async () => {
      try {
        const res = await api.get('/v1/rpt-gangguan/dashboard', { params: { tahun: selectedYear, up3: user?.up3 } });
        const summary = res.data.data.summary;
        setHasTarget(summary.has_target);
        setTargetMenit(summary.target_menit);
      } catch (err) {
        setHasTarget(true); // default true on error
      }
    };
    checkTarget();
  }, [selectedYear, user?.up3]);

  let rataRata = 0;
  if (durasi && gangguan && parseInt(gangguan) > 0) {
      rataRata = parseFloat(durasi) / parseInt(gangguan);
  }

  const isAman = rataRata <= targetMenit;

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      if (parseInt(data.jumlah_gangguan) <= 0) {
          alert('Jumlah gangguan tidak boleh kurang dari atau sama dengan nol.');
          return;
      }

      await api.post(`/v1/rpt-gangguan`, {
          tahun: parseInt(data.tahun),
          bulan: parseInt(data.bulan),
          total_durasi_menit: parseFloat(data.total_durasi_menit),
          jumlah_gangguan: parseInt(data.jumlah_gangguan)
      });

      setSuccess(true);
      reset({ tahun: data.tahun, bulan: '', total_durasi_menit: '', jumlah_gangguan: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Error: " + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'admin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="w-24 h-24 bg-slate-100 rounded-none flex items-center justify-center mb-8 shadow-inner">
                 <AlertCircle size={48} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Akses Terbatas</h2>
              <p className="text-lg text-slate-600 max-w-md">
                 Halaman ini khusus untuk PIC Jaringan UP3. Admin tidak perlu mengisi data RPT.
              </p>
          </div>
      )
  }

  return (
    <div className="w-full mx-auto pb-12 animate-fade-in">
      
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Input RPT Gangguan
            </h1>
            <p className="text-slate-500 text-sm mt-1">Isi data Total Durasi dan Jumlah Gangguan secara mandiri setiap bulan</p>
        </div>
        <button 
            onClick={() => navigate('/jaringan/rpt-gangguan')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm whitespace-nowrap"
        >
            <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-white border border-emerald-200 rounded-lg flex items-center gap-3 shadow-xl animate-bounce-in transition-all">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} />
            </div>
            <div>
                <p className="font-bold text-slate-800 text-sm">Data Berhasil Disimpan!</p>
                <p className="text-xs text-slate-500">Data RPT bulan ini telah tercatat di sistem.</p>
            </div>
        </div>
      )}

      <div className="mb-6">
        <TargetWarning up3={user?.up3 || 'Semua UP3'} year={selectedYear} isVisible={!hasTarget} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-12">
        
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                 <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    Data Periode
                 </h2>
                 <span className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md">
                     {user?.up3}
                 </span>
            </div>
            
            <div className="p-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <select 
                            {...register('bulan', { required: true })} 
                             
                            className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
                        >
                            <option value="">-- PILIH BULAN --</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>

                    <div className="relative w-32">
                        <input 
                            type="number"
                            {...register('tahun', { required: true })} 
                            placeholder="TAHUN"
                             
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                            style={{ fontSize: '0.85rem' }}
                        />
                    </div>
                </div>
                {(errors.bulan || errors.tahun) && <p className="text-red-500 text-xs font-bold mt-2"><AlertCircle size={12} className="inline mr-1"/> Wajib pilih bulan dan tahun!</p>}
            </div>
            
            {/* INPUT FIELDS */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border-t border-slate-100">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Durasi Respon Gangguan (Menit)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...register('total_durasi_menit', { required: true })} 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold shadow-sm"
                        placeholder="Contoh: 1547.50"
                    />
                    {errors.total_durasi_menit && <p className="text-red-500 text-xs mt-1">Wajib diisi.</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Kejadian Gangguan</label>
                    <input 
                        type="number" 
                        min="1"
                        {...register('jumlah_gangguan', { required: true })} 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold shadow-sm"
                        placeholder="Contoh: 50"
                    />
                    {errors.jumlah_gangguan && <p className="text-red-500 text-xs mt-1">Wajib diisi &amp; &gt; 0.</p>}
                </div>

                <div className="md:col-span-2 mt-2 p-4 bg-white border border-slate-200 shadow-sm rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <Activity size={20} className="text-slate-500" />
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-500 mb-0.5">RATA-RATA RPT</p>
                             <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    {rataRata.toFixed(2)} <span className="text-sm font-bold text-slate-500">mnt</span>
                                </p>
                             </div>
                         </div>
                    </div>
                    
                    <div className="text-right">
                         <p className="text-xs font-bold text-slate-500 mb-1">TARGET: {targetMenit} MNT</p>
                         {rataRata > 0 ? (
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${isAman ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                 {isAman ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                 {isAman ? 'AMAN' : 'MELEWATI TARGET'}
                             </span>
                         ) : (
                             <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">MENUNGGU INPUT</span>
                         )}
                    </div>
                </div>
            </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="bg-white border border-slate-200 p-4 shadow-sm w-full">
             <div className="flex gap-4">
                <button 
                    type="submit" 
                    disabled={loading || !hasTarget}
                    className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    \${loading || !hasTarget ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}
                    `}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <><Save size={20} /> SIMPAN DATA RPT</>
                    )}
                </button>
             </div>
        </div>
      </form>
    </div>
  );
}
