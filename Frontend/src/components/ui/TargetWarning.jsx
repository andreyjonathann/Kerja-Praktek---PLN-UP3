import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function TargetWarning({ up3, year, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-orange-800">Peringatan: Target belum ditetapkan</h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>Target tahunan untuk UP3 {up3} tahun {year} belum ditetapkan oleh Admin. Harap hubungi Admin untuk mengatur target tahun ini.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
