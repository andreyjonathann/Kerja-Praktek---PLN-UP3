// Mock data for PLN UP3 KPI Dashboard (planning division)
export const initialDivisions = [
  { id: 1, name: 'Teknik', description: 'Divisi Teknik & Gangguan Jaringan PLN UP3' },
  { id: 2, name: 'Niaga', description: 'Divisi Niaga, Pemasaran & Pelayanan Pelanggan' },
  { id: 3, name: 'Konstruksi', description: 'Divisi Konstruksi & Pembangunan Infrastruktur Kelistrikan' },
  { id: 4, name: 'Perencanaan', description: 'Divisi Perencanaan Strategis & Evaluasi Kinerja (Planning Division)' },
  { id: 5, name: 'SDM', description: 'Divisi Sumber Daya Manusia, Umum, & K3' },
  { id: 6, name: 'Keuangan', description: 'Divisi Keuangan, Akuntansi & Pembayaran Vendor' },
];

export const initialKpis = [
  // Teknik
  { code: 'TEK_SAIDI', divisionId: 1, name: 'SAIDI (System Average Interruption Duration Index)', unit: 'Menit/Plg', aggregationMethod: 'SUM' },
  { code: 'TEK_SAIFI', divisionId: 1, name: 'SAIFI (System Average Interruption Frequency Index)', unit: 'Kali/Plg', aggregationMethod: 'SUM' },
  { code: 'TEK_GGN_SELESAI', divisionId: 1, name: 'Gangguan Terselesaikan', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'TEK_SR_BARU', divisionId: 1, name: 'Pemasangan SR (Sambungan Rumah) Baru', unit: 'Plg', aggregationMethod: 'SUM' },
  
  // Niaga
  { code: 'NIA_KWH_SOLD', divisionId: 2, name: 'Penjualan kWh Listrik', unit: 'kWh', aggregationMethod: 'SUM' },
  { code: 'NIA_PLG_BARU', divisionId: 2, name: 'Pelanggan Baru', unit: 'Plg', aggregationMethod: 'SUM' },
  { code: 'NIA_REVENUE', divisionId: 2, name: 'Pendapatan Penjualan', unit: 'Miliar IDR', aggregationMethod: 'SUM' },
  { code: 'NIA_TUNGGAKAN', divisionId: 2, name: 'Tunggakan Tertagih', unit: '%', aggregationMethod: 'LATEST' },
  
  // Konstruksi
  { code: 'KON_PROGRESS', divisionId: 3, name: 'Progress Pembangunan Infrastruktur', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'KON_REAL_ANGGARAN', divisionId: 3, name: 'Realisasi Anggaran Konstruksi', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'KON_MILESTONE', divisionId: 3, name: 'Milestone Proyek On-Time', unit: '%', aggregationMethod: 'LATEST' },
  
  // Perencanaan
  { code: 'REN_REAL_RKAP', divisionId: 4, name: 'Realisasi RKAP', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'REN_PROG_SELESAI', divisionId: 4, name: 'Program Kerja Selesai', unit: '%', aggregationMethod: 'LATEST' },
  
  // SDM
  { code: 'SDM_HADIR', divisionId: 5, name: 'Kehadiran Karyawan', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'SDM_TRAINING', divisionId: 5, name: 'Realisasi Program Pelatihan', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'SDM_K3_INCIDENT', divisionId: 5, name: 'Insiden Kecelakaan Kerja K3', unit: 'Kasus', aggregationMethod: 'SUM' },
  
  // Keuangan
  { code: 'KEU_OPEX', divisionId: 6, name: 'Realisasi Belanja Operasional (OPEX)', unit: '%', aggregationMethod: 'LATEST' },
  { code: 'KEU_PAY_VENDOR', divisionId: 6, name: 'Ketepatan Waktu Pembayaran Vendor', unit: '%', aggregationMethod: 'LATEST' },
];

export const initialTargets = {
  // Key: code_year_month (month is 1-12, or null/0 for yearly target)
  // Monthly targets for June 2026 (Month 6)
  'TEK_SAIDI_2026_6': 15.5,
  'TEK_SAIFI_2026_6': 1.2,
  'TEK_GGN_SELESAI_2026_6': 95.0,
  'TEK_SR_BARU_2026_6': 500,
  
  'NIA_KWH_SOLD_2026_6': 1200000,
  'NIA_PLG_BARU_2026_6': 450,
  'NIA_REVENUE_2026_6': 4.5,
  'NIA_TUNGGAKAN_2026_6': 98.0,
  
  'KON_PROGRESS_2026_6': 85.0,
  'KON_REAL_ANGGARAN_2026_6': 80.0,
  'KON_MILESTONE_2026_6': 90.0,
  
  'REN_REAL_RKAP_2026_6': 92.0,
  'REN_PROG_SELESAI_2026_6': 88.0,
  
  'SDM_HADIR_2026_6': 97.5,
  'SDM_TRAINING_2026_6': 85.0,
  'SDM_K3_INCIDENT_2026_6': 0, // Target insiden K3 adalah 0
  
  'KEU_OPEX_2026_6': 82.0,
  'KEU_PAY_VENDOR_2026_6': 95.0,

  // Yearly targets for 2026 (Month 0/null representation)
  'TEK_SAIDI_2026_0': 180.0,
  'TEK_SAIFI_2026_0': 12.0,
  'TEK_GGN_SELESAI_2026_0': 98.0,
  'TEK_SR_BARU_2026_0': 6000,
  'NIA_KWH_SOLD_2026_0': 15000000,
  'NIA_PLG_BARU_2026_0': 5000,
  'NIA_REVENUE_2026_0': 55.0,
  'NIA_TUNGGAKAN_2026_0': 99.0,
  'KON_PROGRESS_2026_0': 100.0,
  'KON_REAL_ANGGARAN_2026_0': 95.0,
  'KON_MILESTONE_2026_0': 95.0,
  'REN_REAL_RKAP_2026_0': 95.0,
  'REN_PROG_SELESAI_2026_0': 95.0,
  'SDM_HADIR_2026_0': 98.0,
  'SDM_TRAINING_2026_0': 90.0,
  'SDM_K3_INCIDENT_2026_0': 0,
  'KEU_OPEX_2026_0': 90.0,
  'KEU_PAY_VENDOR_2026_0': 98.0,
};

// Seed daily inputs for June 1st to June 7th, 2026
const generateDailyInputs = () => {
  const inputs = {};
  const startDate = new Date('2026-06-01');
  
  // Set random seed or predefined data
  const baseRealizations = {
    'TEK_SAIDI': 0.5, // per day
    'TEK_SAIFI': 0.04, // per day
    'TEK_GGN_SELESAI': 94.5, // cumulative %
    'TEK_SR_BARU': 15, // per day
    
    'NIA_KWH_SOLD': 38000,
    'NIA_PLG_BARU': 14,
    'NIA_REVENUE': 0.14,
    'NIA_TUNGGAKAN': 96.8,
    
    'KON_PROGRESS': 78.5,
    'KON_REAL_ANGGARAN': 75.2,
    'KON_MILESTONE': 85.0,
    
    'REN_REAL_RKAP': 89.2,
    'REN_PROG_SELESAI': 85.0,
    
    'SDM_HADIR': 96.8,
    'SDM_TRAINING': 80.0,
    'SDM_K3_INCIDENT': 0,
    
    'KEU_OPEX': 77.5,
    'KEU_PAY_VENDOR': 92.5,
  };

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];

    Object.keys(baseRealizations).forEach(code => {
      let val = baseRealizations[code];
      const isSum = ['TEK_SAIDI', 'TEK_SAIFI', 'TEK_SR_BARU', 'NIA_KWH_SOLD', 'NIA_PLG_BARU', 'NIA_REVENUE', 'SDM_K3_INCIDENT'].includes(code);
      
      if (isSum) {
        // Daily values vary slightly
        const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120%
        val = parseFloat((val * randomFactor).toFixed(2));
      } else {
        // Cumulative percentage values creep up slowly
        const randomGrowth = (Math.random() - 0.2) * 0.5; // -0.1% to +0.25%
        baseRealizations[code] = parseFloat(Math.min(100, Math.max(0, baseRealizations[code] + randomGrowth)).toFixed(2));
        val = baseRealizations[code];
      }

      inputs[`${code}_${dateStr}`] = {
        value: val,
        pic: 'pic',
        updatedAt: `${dateStr} 16:30:00`
      };
    });
  }

  return inputs;
};

export const initialDailyInputs = generateDailyInputs();

export const initialLogs = [
  { id: 1, user: 'pic', action: 'CREATE', tableName: 'daily_kpi_inputs', record: 'TEK_SAIDI (2026-06-07)', time: '2026-06-07 16:30:15', details: 'Realisasi: 0.52 Menit' },
  { id: 2, user: 'pic', action: 'CREATE', tableName: 'daily_kpi_inputs', record: 'TEK_SR_BARU (2026-06-07)', time: '2026-06-07 16:31:02', details: 'Realisasi: 18 Pelanggan' },
  { id: 3, user: 'admin', action: 'UPDATE', tableName: 'kpi_targets', record: 'NIA_REVENUE (2026_6)', time: '2026-06-05 09:12:44', details: 'Target diubah dari 4.0 ke 4.5 Miliar IDR' },
  { id: 4, user: 'pic', action: 'UPDATE', tableName: 'daily_kpi_inputs', record: 'KON_PROGRESS (2026-06-04)', time: '2026-06-04 17:05:12', details: 'Realisasi diubah dari 78.1% ke 78.4%' },
];
