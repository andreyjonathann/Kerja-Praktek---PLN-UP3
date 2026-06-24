import api from '@/services/api';
import { MONTHS_SHORT } from '@/utils/formatters';

export const getDashboardData = async (year = 2026) => {
  try {
    // 1. Fetch Jaringan Dashboard Data (SAIDI, SAIFI, ENS, Gangguan)
    const jaringanRes = await api.get(`/jaringan/dashboard?tahun=${year}`);
    const result = jaringanRes.data;

    // 2. Fetch NKO Summary Data
    try {
      const nkoRes = await api.get(`/nko/summary?tahun=${year}`);
      if (nkoRes.data && Array.isArray(nkoRes.data)) {
        nkoRes.data.sort((a, b) => a.bulan - b.bulan);
        const fullNkoTable = [];
        for (let i = 1; i <= 12; i++) {
          const monthData = nkoRes.data.find(d => parseInt(d.bulan) === i);
          if (monthData) {
            fullNkoTable.push(monthData);
          } else {
            fullNkoTable.push({
              bulan: i,
              label: MONTHS_SHORT[i],
              totalNko: null,
              metrics: null
            });
          }
        }
        result.nkoTable = fullNkoTable;
      }
    } catch (nkoErr) {
      console.warn("Failed to fetch NKO data:", nkoErr);
      result.nkoTable = [];
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch API dashboard data:", error);
    throw error;
  }
};
