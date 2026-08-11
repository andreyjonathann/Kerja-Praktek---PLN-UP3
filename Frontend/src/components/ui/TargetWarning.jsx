import React, { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import api from '@/services/api'

export default function TargetWarning({ up3, year, isVisible: propIsVisible, monthName, indicator, indicators }) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If indicator/indicators are not passed, fall back to old behavior using propIsVisible
    if (indicator === undefined && indicators === undefined) {
      setIsVisible(!!propIsVisible);
      return;
    }

    const checkCompleteness = async () => {
      setLoading(true);
      try {
        const queryYear = year || new Date().getFullYear();
        const res = await api.get(`/v1/targets?tahun=${queryYear}`);
        const targets = res.data || [];
        const searchList = indicator ? [indicator] : (indicators || []);
        
        let complete = true;
        for (const ind of searchList) {
          const found = targets.find(t => t.indikator === ind);
          if (!found) {
            complete = false;
            break;
          }
          // Check all 12 months
          const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
          const hasNull = months.some(m => found[`target_${m}`] === null || found[`target_${m}`] === undefined);
          if (hasNull) {
            complete = false;
            break;
          }
        }
        setIsVisible(!complete);
      } catch (err) {
        console.error('Error checking target completeness:', err);
        setIsVisible(true); // default to warning on error
      } finally {
        setLoading(false);
      }
    };

    checkCompleteness();
  }, [year, propIsVisible, indicator, JSON.stringify(indicators)]);

  if (loading || !isVisible) return null;

  return (
    <div 
      className="w-full p-4 rounded-lg shadow-sm border-l-4 animate-fade-in" 
      style={{ 
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light Red Background
        borderColor: '#EF4444', // Solid Red Border
        animation: 'fadeInDown 0.3s ease-out forwards'
      }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: '#DC2626' }}>
            Target Belum Lengkap / Ditetapkan
          </h3>
          <div className="mt-1 text-xs font-medium leading-relaxed" style={{ color: '#B91C1C' }}>
            <p>
              {monthName 
                ? `Target bulan ${monthName} ${year} belum lengkap. Harap hubungi Admin.`
                : `Data target tahun ${year} belum lengkap/ditetapkan seluruhnya. Harap hubungi Admin.`
              }
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
