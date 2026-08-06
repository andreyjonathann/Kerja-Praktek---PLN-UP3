import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function TargetWarning({ up3, year, isVisible, monthName }) {
  if (!isVisible) return null;

  return (
    <div 
      className="w-full p-4 rounded-lg shadow-sm border-l-4" 
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
