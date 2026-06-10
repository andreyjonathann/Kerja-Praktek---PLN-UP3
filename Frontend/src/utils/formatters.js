// Number formatters for PLN Dashboard
export const formatNumber = (val, decimals = 0) => {
  if (val == null || isNaN(val)) return '—'
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatCurrency = (val, unit = 'Rp') => {
  if (val == null || isNaN(val)) return '—'
  const n = Number(val)
  if (n >= 1_000_000_000) return `${unit} ${(n / 1_000_000_000).toFixed(2)} M`
  if (n >= 1_000_000)     return `${unit} ${(n / 1_000_000).toFixed(2)} Jt`
  return `${unit} ${formatNumber(n)}`
}

export const formatPercent = (val, decimals = 2) => {
  if (val == null || isNaN(val)) return '—'
  return `${Number(val).toFixed(decimals)}%`
}

export const formatKwh = (val) => {
  if (val == null || isNaN(val)) return '—'
  const n = Number(val)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} GWh`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)} MWh`
  return `${formatNumber(n)} kWh`
}

export const formatKva = (val) => {
  if (val == null || isNaN(val)) return '—'
  const n = Number(val)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MVA`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)} KVA`
  return `${n} VA`
}

export const MONTHS_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const MONTHS_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export const getMonthName = (m) => MONTHS_ID[m] || ''
export const getMonthShort = (m) => MONTHS_SHORT[m] || ''

// Achievement color based on score
export const getAchievementColor = (pct, isInverse = false) => {
  const score = isInverse ? (100 - Math.min(pct, 100)) : pct
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

export const getAchievementLabel = (pct, isInverse = false) => {
  const score = isInverse ? (100 - Math.min(pct, 100)) : pct
  if (score >= 90) return 'Baik'
  if (score >= 70) return 'Cukup'
  return 'Kurang'
}

// Build chart data for monthly series
export const buildMonthlyChartData = (data, field) => {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const row   = data?.find(d => d.bulan === month)
    return {
      name:     MONTHS_SHORT[month],
      month,
      value:    row?.[field] ?? 0,
      target:   row?.target ?? 0,
      realisasi: row?.realisasi ?? 0,
    }
  })
}

// Cumulative sum from array
export const buildCumulativeData = (monthlyData) => {
  let cumulative = 0
  return monthlyData.map(d => {
    cumulative += d.value || 0
    return { ...d, cumulative }
  })
}
