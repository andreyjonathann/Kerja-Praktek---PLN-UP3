import React, { createContext, useContext, useState } from 'react'

const FilterContext = createContext(null)

const CURRENT_YEAR  = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    year:       CURRENT_YEAR,
    month:      CURRENT_MONTH,
    up3:        'Kebon Jeruk',
    category:   '',
    kpi:        '',
    region:     '',
    kecamatan:  '',
    kelurahan:  '',
  })

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      year:      CURRENT_YEAR,
      month:     CURRENT_MONTH,
      up3:       'Kebon Jeruk',
      category:  '',
      kpi:       '',
      region:    '',
      kecamatan: '',
      kelurahan: '',
    })
  }

  return (
    <FilterContext.Provider value={{ filters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter must be used inside FilterProvider')
  return ctx
}
