import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import api from '@/services/api'
import { 
  Bolt, Plus, Trash2, Edit2, Save, X, Check, 
  AlertCircle, RefreshCw, Layers, TrendingUp, Info, 
  ChevronUp, ChevronDown, Download, AlertTriangle 
} from 'lucide-react'
import { exportToExcel } from '@/utils/exportExcel'

const romanize = (num) => {
  const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
  let roman = ''
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}

const SATUAN_OPTIONS = [
  'GWh',
  '%',
  'Menit/Plg',
  'Kali/Plg',
  'Kali',
  'Pelanggan',
  'MVA',
  'Rp Miliar',
  'kWh',
  'Menit',
  'Ribuan Kali Transaksi',
  'Unit',
  'Rp Juta',
  'kms',
  'mva'
]

export default function TrendNkoPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { filters } = useFilter()
  
  const [activeTab, setActiveTab] = useState('input') // 'input' or 'parameter'
  const [parameters, setParameters] = useState([])
  const [summaryData, setSummaryData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Realization Form State
  const [inputYear, setInputYear] = useState(filters.year || new Date().getFullYear())
  const [inputMonth, setInputMonth] = useState(new Date().getMonth() + 1)
  
  // Table View Filter (independent from form — lets user view other months without touching the form)
  const [viewYear, setViewYear] = useState(filters.year || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1)
  
  const [selectedParamId, setSelectedParamId] = useState('')
  const [targetTahunan, setTargetTahunan] = useState('')
  const [targetBulanan, setTargetBulanan] = useState('')
  const [realisasi, setRealisasi] = useState('')
  
  const [savingRealization, setSavingRealization] = useState(false)
  const [realizationMessage, setRealizationMessage] = useState(null)

  // Parameter CRUD Modal State
  const [showParamModal, setShowParamModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'edit'
  const [editingParamId, setEditingParamId] = useState(null)
  
  const [paramName, setParamName] = useState('')
  const [paramBobot, setParamBobot] = useState('')
  const [paramParentId, setParamParentId] = useState('')
  const [paramPolaritas, setParamPolaritas] = useState('MAXIMIZE')
  const [paramSatuan, setParamSatuan] = useState('')
  const [paramUrutan, setParamUrutan] = useState(0)
  const [paramChildren, setParamChildren] = useState([
    { nama: '', polaritas: 'MAXIMIZE', satuan: '', bobot: '' }
  ])

  // Parameter Tab View Filter (which month/year to show in Master Parameter tree)
  const [paramViewYear, setParamViewYear] = useState(new Date().getFullYear())
  const [paramViewMonth, setParamViewMonth] = useState(new Date().getMonth() + 1)
  const [isEditMode, setIsEditMode] = useState(false)

  // Soft Delete Warning Modal
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, hasHistory: false, message: '' })

  // Render check
  if (authLoading) return null

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  // Fetch initial parameters and realizations summary
  const fetchData = useCallback(async (yearOverride) => {
    setLoading(true)
    const fetchYear = yearOverride ?? inputYear
    try {
      // Fetch parameters — if Tab 2 is active, filter by paramViewYear/paramViewMonth
      const paramRes = await api.get('/nko-parameters')
      setParameters(paramRes.data.data || [])
      
      const summaryRes = await api.get(`/nko/summary?tahun=${fetchYear}`)
      setSummaryData(summaryRes.data || [])
    } catch (err) {
      console.error('Failed to load Trend NKO data:', err)
    } finally {
      setLoading(false)
    }
  }, [inputYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Re-fetch when viewYear changes independently (user browsing historical data)
  useEffect(() => {
    if (viewYear !== inputYear) {
      fetchData(viewYear)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear])

  // Re-fetch parameters when paramViewYear/paramViewMonth changes (Master Parameter tab filter)
  const fetchParameters = useCallback(async (year, month) => {
    try {
      const paramRes = await api.get(`/nko-parameters?tahun=${year}&bulan=${month}`)
      setParameters(paramRes.data.data || [])
    } catch (err) {
      console.error('Failed to load parameters:', err)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'parameter') {
      fetchParameters(paramViewYear, paramViewMonth)
    }
  }, [activeTab, paramViewYear, paramViewMonth, fetchParameters])

  // Intercept browser reloads/closes when in edit mode
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditMode) {
        e.preventDefault()
        e.returnValue = 'Perubahan Anda belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditMode])

  // Share edit mode block state globally with Layout/Sidebar
  useEffect(() => {
    window.sigap_block_navigation = isEditMode
    return () => {
      window.sigap_block_navigation = false
    }
  }, [isEditMode])

  const handleTabClick = (tab) => {
    if (isEditMode) {
      alert('Harap simpan perubahan parameter Anda terlebih dahulu dengan mengklik tombol "Simpan Perubahan".')
      return
    }
    setActiveTab(tab)
  }

  // Get table-view month's NKO data (separate from form input)
  const currentData = useMemo(() => {
    if (!summaryData) return null
    return summaryData.find(d => d.bulan === Number(viewMonth))
  }, [summaryData, viewMonth])

  // Map flat NKO metrics directly to table rows
  const tableRows = useMemo(() => {
    if (!currentData || !currentData.metrics) return []
 
    return currentData.metrics.map(m => ({
      id: m.id,
      parent_id: m.parent_id,
      no: m.no,
      kpi: m.kpi,
      rawKpi: m.kpi,
      level: m.level,
      isParent: m.level === 1,
      isSub: m.level === 2,
      isDetail: m.level === 3,
      isLeafParent: m.level === 1 && m.is_leaf,
      is_leaf: m.is_leaf,
      satuan: m.satuan ?? '-',
      polaritas: m.polaritas ?? '-',
      bobot: m.bobot ?? 0,
      target_tahunan: m.target_tahunan,
      target_bulanan: m.target_bulanan,
      realisasi: m.realisasi,
      pencapaian: m.pencapaian,
      nilai: m.nilai,
      keterangan: m.keterangan,
      bidang: m.bidang
    }))
  }, [currentData])

  // Extract flat list of active sub-parameters recursively (leaves only)
  const activeSubParameters = useMemo(() => {
    const leaves = []
    
    const findLeaves = (param, parentName) => {
      const activeChildren = param.children ? param.children.filter(c => c.is_active) : []
      if (activeChildren.length > 0) {
        activeChildren.forEach(child => {
          findLeaves(child, param.parent_id ? `${parentName} - ${param.nama}` : param.nama)
        })
      } else {
        if (param.is_active) {
          leaves.push({
            ...param,
            parentName: parentName
          })
        }
      }
    }

    parameters.forEach(parent => {
      findLeaves(parent, 'Utama')
    })
    
    return leaves
  }, [parameters])

  // Filter leaf sub-parameters based on user role (PIC vs Admin)
  const filterParamsByPicRole = useMemo(() => {
    if (isAdmin || user?.role === 'admin') return activeSubParameters

    const userRole = user?.role ? user.role.toLowerCase() : ''
    return activeSubParameters.filter(p => {
      const parentName = p.parentName.toUpperCase()
      if (userRole === 'pic_jaringan' || userRole === 'jaringan') {
        return parentName.includes('JARINGAN') || parentName.includes('KEANDALAN') || parentName.includes('RATING NEGATIF');
      }
      if (userRole === 'pic_pemasaran' || userRole === 'pemasaran') {
        return parentName.includes('PEMASARAN');
      }
      if (userRole === 'pic_niaga' || userRole === 'niaga') {
        return parentName.includes('NIAGA');
      }
      if (userRole === 'pic_aset' || userRole === 'aset' || userRole === 'pic_pengadaan' || userRole === 'pengadaan') {
        return parentName.includes('ASET') || parentName.includes('PENGADAAN');
      }
      if (userRole === 'pic_transaksi_energi' || userRole === 'transaksi_energi' || userRole === 'transaksi energi') {
        return parentName.includes('TRANSAKSI');
      }
      if (userRole === 'pic_keuangan' || userRole === 'keuangan') {
        return parentName.includes('KEUANGAN');
      }
      return false
    })
  }, [activeSubParameters, user, isAdmin])

  // Check if current user is authorized to edit a parameter row based on role/bidang
  const isRowEditable = useCallback((row) => {
    if (isAdmin || user?.role === 'admin') return true
    if (!row.bidang) return false

    const parentName = row.bidang.toUpperCase()
    const userRole = user?.role ? user.role.toLowerCase() : ''

    if (userRole === 'pic_jaringan' || userRole === 'jaringan') {
      return parentName.includes('JARINGAN') || parentName.includes('KEANDALAN') || parentName.includes('RATING NEGATIF');
    }
    if (userRole === 'pic_pemasaran' || userRole === 'pemasaran') {
      return parentName.includes('PEMASARAN');
    }
    if (userRole === 'pic_niaga' || userRole === 'niaga') {
      return parentName.includes('NIAGA');
    }
    if (userRole === 'pic_aset' || userRole === 'aset' || userRole === 'pic_pengadaan' || userRole === 'pengadaan') {
      return parentName.includes('ASET') || parentName.includes('PENGADAAN');
    }
    if (userRole === 'pic_transaksi_energi' || userRole === 'transaksi_energi' || userRole === 'transaksi energi') {
      return parentName.includes('TRANSAKSI');
    }
    if (userRole === 'pic_keuangan' || userRole === 'keuangan') {
      return parentName.includes('KEUANGAN');
    }

    return false
  }, [user, isAdmin])

  // Selected sub-parameter definition
  const selectedParam = useMemo(() => {
    return activeSubParameters.find(p => p.id === Number(selectedParamId))
  }, [selectedParamId, activeSubParameters])

  // Auto fill form values when selecting parameter from dropdown
  useEffect(() => {
    if (selectedParamId) {
      const match = tableRows.find(r => r.id === Number(selectedParamId))
      if (match) {
        setTargetTahunan(match.target_tahunan !== null ? match.target_tahunan.toString() : '')
        setTargetBulanan(match.target_bulanan !== null ? match.target_bulanan.toString() : '')
        setRealisasi(match.realisasi !== null ? match.realisasi.toString() : '')
      } else {
        setTargetTahunan('')
        setTargetBulanan('')
        setRealisasi('')
      }
    } else {
      setTargetTahunan('')
      setTargetBulanan('')
      setRealisasi('')
    }
  }, [selectedParamId, tableRows])

  // Load selected table row details into input form
  const handleSelectEditRow = (row) => {
    setSelectedParamId(row.id.toString())
    setTargetTahunan(row.target_tahunan !== null ? row.target_tahunan.toString() : '')
    setTargetBulanan(row.target_bulanan !== null ? row.target_bulanan.toString() : '')
    setRealisasi(row.realisasi !== null ? row.realisasi.toString() : '')
  }

  // Real-time live achievement preview computation
  const livePreview = useMemo(() => {
    const targetVal = parseFloat(targetBulanan)
    const realisasiVal = parseFloat(realisasi)

    if (isNaN(targetVal) || isNaN(realisasiVal) || !selectedParam) {
      return { pencapaian: null, nilai: null, keterangan: null }
    }

    let pencapaian = 0
    if (targetVal > 0) {
      const isMaximize = selectedParam.polaritas === 'MAXIMIZE'
      if (isMaximize) {
        pencapaian = (realisasiVal / targetVal) * 100
      } else {
        pencapaian = (2 - (realisasiVal / targetVal)) * 100
      }
    } else if (targetVal === 0) {
      const isMaximize = selectedParam.polaritas === 'MAXIMIZE'
      if (isMaximize) {
        pencapaian = realisasiVal > 0 ? 120 : 0
      } else {
        pencapaian = realisasiVal === 0 ? 100 : 0
      }
    }

    pencapaian = Math.max(0, Math.min(pencapaian, 120))
    const nilai = (pencapaian * parseFloat(selectedParam.bobot)) / 100

    let keterangan = 'MASALAH'
    if (pencapaian >= 100) {
      keterangan = 'BAIK'
    } else if (pencapaian >= 95) {
      keterangan = 'HATI-HATI'
    }

    return { pencapaian, nilai, keterangan }
  }, [targetBulanan, realisasi, selectedParam])

  // Handle realization submission
  const handleSaveRealization = async (e) => {
    e.preventDefault()
    if (!selectedParamId || !targetBulanan || !realisasi) {
      setRealizationMessage({ type: 'error', text: 'Semua field wajib diisi.' })
      return
    }

    setSavingRealization(true)
    setRealizationMessage(null)
    try {
      const payload = {
        parameter_id: Number(selectedParamId),
        tahun: Number(inputYear),
        bulan: Number(inputMonth),
        target_tahunan: targetTahunan ? parseFloat(targetTahunan) : null,
        target_bulanan: parseFloat(targetBulanan),
        realisasi: parseFloat(realisasi)
      }

      await api.post('/nko-realizations', payload)
      setRealizationMessage({ type: 'success', text: 'Data realisasi berhasil disimpan!' })
      
      // Reset input fields
      setRealisasi('')
      setTargetBulanan('')
      setTargetTahunan('')
      setSelectedParamId('')
      
      // Refresh list
      fetchData()
      
      // Dispatch refresh event
      window.dispatchEvent(new CustomEvent('sigap:refresh'))
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal menyimpan realisasi.'
      setRealizationMessage({ type: 'error', text: errMsg })
    } finally {
      setSavingRealization(false)
    }
  }

  const formatNum = (v) => {
    if (v == null) return '-'
    return Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleExportHistory = () => {
    if (!tableRows.length) return
    const exportData = tableRows.map(row => ({
      'No': row.no,
      'Parameter': row.kpi,
      'Polaritas': row.polaritas,
      'Satuan': row.satuan,
      'Bobot': row.bobot,
      'Target KPI Tahunan': row.target_tahunan != null ? row.target_tahunan : '-',
      'Target Bulan Ini': row.target_bulanan != null ? row.target_bulanan : '-',
      'Realisasi Bulan Ini': row.realisasi != null ? row.realisasi : '-',
      'Pencapaian (%)': row.pencapaian != null ? parseFloat(row.pencapaian.toFixed(2)) : '-',
      'Nilai': row.nilai != null ? parseFloat(row.nilai.toFixed(2)) : '-',
      'Keterangan': row.keterangan || (row.isSub ? 'BELUM DIISI' : '-')
    }))
    exportToExcel(exportData, `Trend_NKO_${MONTHS.find(m => m.value === Number(inputMonth))?.label}_${inputYear}`)
  }

  const renderPencapaian = (v) => {
    if (v == null || !isFinite(v)) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
    const isSuccess = v >= 100
    const isWarn = v >= 95 && v < 100
    
    let bg = 'rgba(239, 68, 68, 0.1)'
    let text = '#EF4444'
    let border = 'rgba(239, 68, 68, 0.2)'

    if (isSuccess) {
      bg = 'rgba(16, 185, 129, 0.1)'
      text = '#10B981'
      border = 'rgba(16, 185, 129, 0.2)'
    } else if (isWarn) {
      bg = 'rgba(245, 158, 11, 0.1)'
      text = '#F59E0B'
      border = 'rgba(245, 158, 11, 0.2)'
    }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '3px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 800,
        background: bg, color: text, border: `1px solid ${border}`
      }}>
        {formatNum(v)}%
      </span>
    )
  }

  const renderKeteranganBadge = (status, isSub) => {
    if (!status) {
      return isSub ? (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800,
          background: 'var(--border)', color: 'var(--text-muted)', minWidth: '85px'
        }}>
          BELUM DIISI
        </span>
      ) : <span style={{ color: 'var(--text-muted)' }}>-</span>
    }
    
    let bg = 'rgba(239, 68, 68, 0.1)'
    let text = '#EF4444'
    let border = 'rgba(239, 68, 68, 0.2)'
    
    if (status === 'BAIK') {
      bg = 'rgba(16, 185, 129, 0.1)'
      text = '#10B981'
      border = 'rgba(16, 185, 129, 0.2)'
    } else if (status === 'HATI-HATI') {
      bg = 'rgba(245, 158, 11, 0.1)'
      text = '#F59E0B'
      border = 'rgba(245, 158, 11, 0.2)'
    }
    
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800,
        background: bg, color: text, border: `1px solid ${border}`,
        minWidth: '85px', textAlign: 'center'
      }}>
        {status}
      </span>
    )
  }

  // Recursive helper to find a parameter at any depth
  const findParamById = useCallback((id, list) => {
    for (const p of list) {
      if (p.id === id) return p
      if (p.children && p.children.length > 0) {
        const found = findParamById(id, p.children)
        if (found) return found
      }
    }
    return null
  }, [])

  // Weights sum calculation for UI badges
  const parentWeightsSum = useMemo(() => {
    return parameters.reduce((sum, p) => sum + (Number(p.bobot) || 0), 0)
  }, [parameters])

  const childrenWeightsSum = useMemo(() => {
    return paramChildren.reduce((sum, c) => sum + (Number(c.bobot) || 0), 0)
  }, [paramChildren])

  const siblingWeightsSum = useMemo(() => {
    if (!paramParentId) return 0
    const parentObj = findParamById(Number(paramParentId), parameters)
    if (!parentObj || !parentObj.children) return 0
    return parentObj.children.reduce((sum, child) => {
      if (modalMode === 'edit' && child.id === editingParamId) return sum
      return sum + (Number(child.bobot) || 0)
    }, 0)
  }, [paramParentId, parameters, modalMode, editingParamId, findParamById])

  // Trigger Parameter creation / update
  const handleSaveParameter = async (e) => {
    e.preventDefault()
    if (!paramName.trim()) {
      alert('Nama parameter wajib diisi.')
      return
    }

    try {
      if (modalMode === 'create') {
        // Filter children with valid names
        const validChildren = paramParentId ? null : paramChildren.filter(c => c.nama.trim() !== '')

        // If bobot is empty, auto-calculate from valid children
        let resolvedBobot = paramBobot !== '' && paramBobot !== null ? parseFloat(paramBobot) : null
        if ((resolvedBobot === null || isNaN(resolvedBobot)) && validChildren && validChildren.length > 0) {
          resolvedBobot = validChildren.reduce((sum, c) => sum + (parseFloat(c.bobot) || 0), 0)
        }

        const payload = {
          nama: paramName,
          bobot: resolvedBobot ?? 0,
          parent_id: paramParentId ? Number(paramParentId) : null,
          polaritas: paramPolaritas || null,
          satuan: paramSatuan || null,
          urutan: Number(paramUrutan),
          children: validChildren,
          created_at: `${paramViewYear}-${String(paramViewMonth).padStart(2, '0')}-01 00:00:00`
        }

        await api.post('/nko-parameters', payload)
      } else {
        // For edit mode: if bobot is not supplied, keep existing
        const resolvedBobot = paramBobot !== '' && paramBobot !== null ? parseFloat(paramBobot) : null

        const payload = {
          nama: paramName,
          polaritas: paramPolaritas || null,
          satuan: paramSatuan || null,
          urutan: Number(paramUrutan),
          is_active: true
        }

        if (resolvedBobot !== null && !isNaN(resolvedBobot)) {
          payload.bobot = resolvedBobot
        }

        await api.put(`/nko-parameters/${editingParamId}`, payload)
      }

      setShowParamModal(false)
      fetchData()
      window.dispatchEvent(new CustomEvent('sigap:refresh'))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan parameter.')
    }
  }

  // Trigger Parameter deletion (Soft delete)
  const handleDeleteParam = async (id, force = false) => {
    try {
      const res = await api.delete(`/nko-parameters/${id}${force ? '?force=true' : ''}`)
      
      if (res.data.has_history && !force) {
        setDeleteConfirm({
          show: true,
          id: id,
          hasHistory: true,
          message: res.data.message
        })
        return
      }

      setDeleteConfirm({ show: false, id: null, hasHistory: false, message: '' })
      fetchData()
      window.dispatchEvent(new CustomEvent('sigap:refresh'))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus parameter.')
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setParamName('')
    setParamBobot('')
    setParamParentId('')
    setParamPolaritas('')
    setParamSatuan('')
    setParamUrutan(parameters.length + 1)
    setParamChildren([{ nama: '', polaritas: '', satuan: '', bobot: '' }])
    setShowParamModal(true)
  }

  const openCreateSubModal = (parent) => {
    setModalMode('create')
    setParamParentId(parent.id.toString())
    setParamName('')
    setParamBobot('')
    setParamPolaritas('')
    setParamSatuan('')
    const existingChildrenCount = parent.children ? parent.children.length : 0
    setParamUrutan(existingChildrenCount + 1)
    setShowParamModal(true)
  }

  const openEditModal = (param) => {
    setModalMode('edit')
    setEditingParamId(param.id)
    setParamName(param.nama)
    setParamBobot(param.bobot)
    setParamParentId(param.parent_id || '')
    setParamPolaritas(param.polaritas)
    setParamSatuan(param.satuan || '')
    setParamUrutan(param.urutan)
    setShowParamModal(true)
  }

  // Handle Child dynamic input rows
  const handleAddChildRow = () => {
    setParamChildren([...paramChildren, { nama: '', polaritas: '', satuan: '', bobot: '' }])
  }

  const handleRemoveChildRow = (index) => {
    setParamChildren(paramChildren.filter((_, i) => i !== index))
  }

  const handleChildChange = (index, field, value) => {
    const updated = [...paramChildren]
    updated[index][field] = value
    setParamChildren(updated)
  }

  // Reordering handler
  const handleMoveOrder = async (param, direction) => {
    const siblingQuery = param.parent_id 
      ? parameters.find(p => p.id === param.parent_id)?.children 
      : parameters;
      
    if (!siblingQuery) return;

    const currentIndex = siblingQuery.findIndex(p => p.id === param.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= siblingQuery.length) return

    const targetParam = siblingQuery[targetIndex]

    try {
      // Swap order positions
      await api.put(`/nko-parameters/${param.id}`, { urutan: targetParam.urutan })
      await api.put(`/nko-parameters/${targetParam.id}`, { urutan: param.urutan })
      fetchData()
      window.dispatchEvent(new CustomEvent('sigap:refresh'))
    } catch (err) {
      console.error('Failed to swap parameter order:', err)
    }
  }
 
  const renderParameterNode = (param, depth = 0, indexNum = 0, parentArray = [], editMode = false) => {
    const isParent = depth === 0
    const isSub = depth === 1
    const isDetail = depth === 2
 
    const childWeightsTotal = param.children ? param.children.reduce((sum, c) => sum + c.bobot, 0) : 0
 
    if (isParent) {
      return (
        <div key={param.id} style={{ 
          border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(20, 162, 186, 0.01)', overflow: 'hidden', marginBottom: '16px' 
        }}>
          {/* Parent row */}
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', 
            background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--text-muted)' }}>{romanize(indexNum + 1)}.</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{param.nama}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'var(--border)', color: 'var(--text-secondary)' }}>
                Bobot: {param.bobot}%
              </span>
            </div>
            
            {/* Parent actions — only visible in edit mode */}
            {editMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => openCreateSubModal(param)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#10B981' }} className="hover:opacity-75" title="Tambah Sub Parameter">
                  <Plus size={16} />
                </button>
                <button onClick={() => handleMoveOrder(param, 'up')} disabled={indexNum === 0} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} className="hover:text-slate-800 disabled:opacity-30">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => handleMoveOrder(param, 'down')} disabled={indexNum === parentArray.length - 1} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} className="hover:text-slate-800 disabled:opacity-30">
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => openEditModal(param)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#14A2BA' }} className="hover:opacity-75">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteParam(param.id)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }} className="hover:opacity-75">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
 
          {/* Children block */}
          <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column' }}>
            {param.children && param.children.length > 0 ? (
              param.children.map((child, cIdx) => renderParameterNode(child, 1, cIdx, param.children, editMode))
            ) : (
              <div style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Belum ada sub-parameter.
              </div>
            )}
 
            {/* Sub-parameter weights summary indicator */}
            {param.children && param.children.length > 0 && (
              <div style={{ 
                alignSelf: 'flex-start', margin: '8px 16px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                background: Math.abs(childWeightsTotal - param.bobot) < 0.01 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                color: Math.abs(childWeightsTotal - param.bobot) < 0.01 ? '#10B981' : '#F59E0B',
                border: `1px solid ${Math.abs(childWeightsTotal - param.bobot) < 0.01 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`
              }}>
                Sub-Parameter Weight Sum: {childWeightsTotal.toFixed(2)}% / {param.bobot.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )
    }
 
    // Depth 1 (isSub) or Depth 2 (isDetail)
    const prefix = isSub ? `${String.fromCharCode(97 + indexNum)}.` : '-'
    const paddingLeftValue = isSub ? '16px' : '36px'
 
    return (
      <div key={param.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', padding: '10px 0', 
          borderBottom: '1px solid rgba(0,0,0,0.03)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, paddingLeft: paddingLeftValue }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{prefix}</span>
            <span style={{ fontSize: '0.825rem', color: isDetail ? 'var(--text-muted)' : 'var(--text-secondary)', fontWeight: isDetail ? 500 : 600 }}>{param.nama}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({param.polaritas === 'MAXIMIZE' ? 'Positif' : param.polaritas === 'MINIMIZE' ? 'Negatif' : param.polaritas === 'RANGE' ? 'Range' : (param.polaritas || '-')} | {param.satuan || '-'})</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--pln-blue)' }}>
              Bobot: {param.bobot}%
            </span>
          </div>
 
          {/* Child actions — only visible in edit mode */}
          {editMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSub && (
                <button onClick={() => openCreateSubModal(param)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#10B981' }} className="hover:opacity-75" title="Tambah Detail Sub Parameter">
                  <Plus size={14} />
                </button>
              )}
              <button onClick={() => handleMoveOrder(param, 'up')} disabled={indexNum === 0} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} className="hover:text-slate-800 disabled:opacity-30">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => handleMoveOrder(param, 'down')} disabled={indexNum === parentArray.length - 1} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} className="hover:text-slate-800 disabled:opacity-30">
                <ChevronDown size={14} />
              </button>
              <button onClick={() => openEditModal(param)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#14A2BA' }} className="hover:opacity-75">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDeleteParam(param.id)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }} className="hover:opacity-75">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
 
        {/* Recursive rendering of Level 3 under Level 2 */}
        {isSub && param.children && param.children.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {param.children.map((grandchild, gIdx) => renderParameterNode(grandchild, 2, gIdx, param.children, editMode))}
            
            {/* Level 3 weight validation under Level 2 */}
            <div style={{ 
              alignSelf: 'flex-start', margin: '4px 16px 8px 36px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
              background: Math.abs(childWeightsTotal - param.bobot) < 0.01 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              color: Math.abs(childWeightsTotal - param.bobot) < 0.01 ? '#10B981' : '#F59E0B',
              border: `1px solid ${Math.abs(childWeightsTotal - param.bobot) < 0.01 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`
            }}>
              Detail Weight Sum: {childWeightsTotal.toFixed(2)}% / {param.bobot.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    )
  }
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Header Panel */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper-interactive" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(20, 162, 186,0.2), rgba(20, 162, 186,0.08))', border: '1px solid rgba(20, 162, 186,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={24} style={{ color: '#14A2BA' }} />
          </div>
          <div>
            <h1 className="page-heading" style={{ marginBottom: 4 }}>Kelola & Input Trend NKO</h1>
            <p className="page-description">Input realisasi bulanan dan kelola struktur bobot penilaian parameter KPI.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--border)', padding: 4, borderRadius: 10 }}>
          <button 
            onClick={() => handleTabClick('input')}
            style={{
              padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
              background: activeTab === 'input' ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === 'input' ? 'var(--pln-blue)' : 'var(--text-muted)'
            }}
            className="transition"
          >
            Input Realisasi
          </button>
          {isAdmin && (
            <button 
              onClick={() => handleTabClick('parameter')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                background: activeTab === 'parameter' ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === 'parameter' ? 'var(--pln-blue)' : 'var(--text-muted)'
              }}
              className="transition"
            >
              Master Parameter
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <RefreshCw size={32} className="animate-spin text-slate-300" />
        </div>
      )}

      {!loading && activeTab === 'input' && (
        /* TAB 1: Input Realisasi Bulanan (Split-screen) */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }} className="nko-grid">
          
          {/* Left Panel: Form Input */}
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '84px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} className="text-teal-500" />
              Realisasi Bulanan
            </h2>

            {realizationMessage && (
              <div style={{ 
                padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', fontWeight: 650,
                background: realizationMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: realizationMessage.type === 'success' ? '#10B981' : '#EF4444',
                border: `1px solid ${realizationMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {realizationMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveRealization} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Year & Month Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tahun</label>
                  <select 
                    value={inputYear} 
                    onChange={(e) => { setInputYear(Number(e.target.value)); setViewYear(Number(e.target.value)) }}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bulan</label>
                  <select 
                    value={inputMonth} 
                    onChange={(e) => { setInputMonth(Number(e.target.value)); setViewMonth(Number(e.target.value)) }}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parameter Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Parameter KPI</label>
                <select
                  value={selectedParamId}
                  onChange={(e) => setSelectedParamId(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 650 }}
                  required
                >
                  <option value="">-- Pilih Sub Parameter --</option>
                  {filterParamsByPicRole.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.parent_id ? `[${p.parentName}] ${p.nama}` : `[Utama] ${p.nama}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Target/Realisasi inputs */}
              {selectedParam && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Polaritas: <strong className="text-teal-600">{selectedParam.polaritas === 'MAXIMIZE' ? 'Positif' : selectedParam.polaritas === 'MINIMIZE' ? 'Negatif' : selectedParam.polaritas === 'RANGE' ? 'Range' : selectedParam.polaritas}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Bobot KPI: <strong className="text-teal-600">{selectedParam.bobot}%</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Tahunan ({selectedParam.satuan})</label>
                    <input 
                      type="number" step="any"
                      placeholder="Masukkan target tahunan (opsional)"
                      value={targetTahunan} 
                      onChange={(e) => setTargetTahunan(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Bulan Ini ({selectedParam.satuan})</label>
                    <input 
                      type="number" step="any"
                      placeholder="Masukkan target bulanan"
                      value={targetBulanan} 
                      onChange={(e) => setTargetBulanan(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Realisasi Bulan Ini ({selectedParam.satuan})</label>
                    <input 
                      type="number" step="any"
                      placeholder="Masukkan nilai realisasi"
                      value={realisasi} 
                      onChange={(e) => setRealisasi(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                      required
                    />
                  </div>

                  {/* Live Calculation Preview */}
                  {livePreview.pencapaian !== null && (
                    <div style={{ 
                      padding: '12px 16px', borderRadius: '10px', 
                      background: 'var(--border)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview Live Skor</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {livePreview.pencapaian.toFixed(2).replace('.', ',')}%
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(Pencapaian)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: livePreview.pencapaian >= 100 ? '#10B981' : livePreview.pencapaian >= 95 ? '#F59E0B' : '#EF4444' }}>
                            {livePreview.keterangan}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--text-secondary)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '4px', marginTop: '2px' }}>
                        Skor Kontribusi Nilai: <strong className="text-teal-600">{livePreview.nilai.toFixed(3).replace('.', ',')}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={savingRealization || !selectedParamId}
                style={{ 
                  marginTop: '12px', padding: '12px', borderRadius: '10px', 
                  background: '#14A2BA', color: 'white', border: 'none', 
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: (savingRealization || !selectedParamId) ? 0.6 : 1
                }}
                className="hover:opacity-90 transition shadow-sm"
              >
                <Save size={18} />
                {savingRealization ? 'Menyimpan...' : 'Simpan Realisasi'}
              </button>
            </form>
          </div>

          {/* Right Panel: Hierarchical Rekap Table with Edit Action */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Rincian Parameter KPI NKO</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Klik tombol pensil pada baris parameter untuk melakukan penginputan atau pengeditan data.</p>
              </div>
              
              {/* Table View Filter: month/year picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: 8, background: 'var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Tampilkan:
                </div>
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button 
                  onClick={handleExportHistory}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    padding: '6px 12px', borderRadius: '8px', 
                    background: '#10B981', color: 'white', 
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
                  }}
                  className="hover:opacity-90 transition shadow-sm"
                >
                  <Download size={15} />
                  Ekspor
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', borderBottom: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-table-head)', borderBottom: '2px solid var(--border-strong)' }}>
                    <th style={thStyle({ textAlign: 'center', width: '4%' })}>NO</th>
                    <th style={thStyle({ textAlign: 'left', width: '22%' })}>PARAMETER</th>
                    <th style={thStyle({ textAlign: 'center', width: '8%' })}>POLARITAS</th>
                    <th style={thStyle({ textAlign: 'center', width: '7%' })}>SATUAN</th>
                    <th style={thStyle({ textAlign: 'center', width: '5%' })}>BOBOT</th>
                    <th style={thStyle({ textAlign: 'right', width: '10%' })}>TARGET TAHUNAN</th>
                    <th style={thStyle({ textAlign: 'right', width: '10%' })}>TARGET {(MONTHS.find(m => m.value === viewMonth)?.label || '').toUpperCase()}</th>
                    <th style={thStyle({ textAlign: 'right', width: '10%' })}>REALISASI {(MONTHS.find(m => m.value === viewMonth)?.label || '').toUpperCase()}</th>
                    <th style={thStyle({ textAlign: 'center', width: '10%' })}>PENCAPAIAN (%)</th>
                    <th style={thStyle({ textAlign: 'right', width: '7%' })}>NILAI</th>
                    <th style={thStyle({ textAlign: 'center', width: '10%' })}>KETERANGAN</th>
                    <th style={thStyle({ textAlign: 'center', width: '7%' })}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => {
                    const editable = row.is_leaf && isRowEditable(row)
 
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: row.level === 1 ? 'rgba(20, 162, 186, 0.03)' : 'transparent',
                          fontWeight: row.level === 1 ? 750 : (!row.is_leaf ? 700 : 500),
                          color: row.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        <td style={tdStyle({ textAlign: 'center', color: row.level === 1 ? 'var(--text-primary)' : 'var(--text-muted)' })}>
                          {row.no}
                        </td>
                        <td style={tdStyle({ 
                          textAlign: 'left', 
                          paddingLeft: row.level === 1 ? '10px' : (row.level === 2 ? '24px' : '44px'),
                          color: row.level === 1 ? 'var(--text-primary)' : (!row.is_leaf ? 'var(--text-secondary)' : 'var(--text-secondary)'),
                          whiteSpace: 'normal',
                          lineHeight: 1.4
                        })}>
                          {row.kpi}
                        </td>
                        <td style={tdStyle({ textAlign: 'center', fontSize: '0.75rem' })}>
                          {row.polaritas === 'MAXIMIZE' ? 'Positif' : row.polaritas === 'MINIMIZE' ? 'Negatif' : row.polaritas === 'RANGE' ? 'Range' : (row.polaritas || '-')}
                        </td>
                        <td style={tdStyle({ textAlign: 'center', color: 'var(--text-muted)' })}>
                          {row.satuan}
                        </td>
                        <td style={tdStyle({ textAlign: 'center' })}>
                          {row.bobot}%
                        </td>
                        <td style={tdStyle({ textAlign: 'right' })}>
                          {row.target_tahunan !== null ? formatNum(row.target_tahunan) : '-'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right' })}>
                          {row.target_bulanan !== null ? formatNum(row.target_bulanan) : '-'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right' })}>
                          {row.realisasi !== null ? formatNum(row.realisasi) : '-'}
                        </td>
                        <td style={tdStyle({ textAlign: 'center' })}>
                          {renderPencapaian(row.pencapaian)}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', color: 'var(--text-primary)' })}>
                          {row.nilai !== null ? formatNum(row.nilai) : '-'}
                        </td>
                        <td style={tdStyle({ textAlign: 'center' })}>
                          {renderKeteranganBadge(row.keterangan, row.is_leaf)}
                        </td>
                        <td style={tdStyle({ textAlign: 'center' })}>
                          {editable ? (
                            <button
                              type="button"
                              onClick={() => handleSelectEditRow(row)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#14A2BA', padding: 4 }}
                              className="hover:opacity-75"
                              title="Pilih parameter untuk diinput/edit"
                            >
                              <Edit2 size={15} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {!loading && activeTab === 'parameter' && isAdmin && (
        /* TAB 2: Master Parameter CRUD (Admin Only) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Weights validation summary */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderLeft: `4px solid ${parentWeightsSum === 100 ? '#10B981' : '#EF4444'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {parentWeightsSum === 100 ? (
                <Check size={20} className="text-emerald-500" />
              ) : (
                <AlertTriangle size={20} className="text-red-500" />
              )}
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Bobot Parameter Utama</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Jumlah bobot seluruh Parameter Utama harus bernilai tepat 100%.</p>
              </div>
            </div>
            <span style={{
              fontSize: '0.9rem', fontWeight: 850, padding: '4px 10px', borderRadius: 8,
              background: parentWeightsSum === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: parentWeightsSum === 100 ? '#10B981' : '#EF4444'
            }}>
              {parentWeightsSum.toFixed(2)}% / 100%
            </span>
          </div>

          {/* Parameters tree structure */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Struktur Hierarki Parameter NKO</h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Menampilkan parameter aktif pada: <strong>{MONTHS.find(m => m.value === paramViewMonth)?.label} {paramViewYear}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Period filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: 8, background: 'var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Periode:
                </div>
                <select
                  value={paramViewMonth}
                  onChange={(e) => setParamViewMonth(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={paramViewYear}
                  onChange={(e) => setParamViewYear(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Edit Parameter and Add buttons */}
                {paramViewYear === new Date().getFullYear() && paramViewMonth === new Date().getMonth() + 1 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isEditMode ? (
                      <>
                        <button
                          onClick={openCreateModal}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '8px 14px', borderRadius: '8px', 
                            background: 'transparent', color: '#14A2BA', 
                            border: '1px solid #14A2BA', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                          }}
                          className="hover:bg-slate-50 transition shadow-sm"
                        >
                          <Plus size={16} />
                          Tambah Parameter Utama
                        </button>
                        <button
                          onClick={() => setIsEditMode(false)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '8px 14px', borderRadius: '8px', 
                            background: '#10B981', color: 'white', 
                            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                          }}
                          className="hover:opacity-90 transition shadow-sm"
                        >
                          <Save size={16} />
                          Simpan Perubahan
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditMode(true)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', 
                          padding: '8px 14px', borderRadius: '8px', 
                          background: '#14A2BA', color: 'white', 
                          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                        }}
                        className="hover:opacity-90 transition shadow-sm"
                      >
                        <Edit2 size={16} />
                        Edit Parameter
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info banner when viewing historical period */}
            {(paramViewYear !== new Date().getFullYear() || paramViewMonth !== new Date().getMonth() + 1) && (
              <div style={{
                padding: '10px 24px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.78rem', fontWeight: 600, color: '#D97706'
              }}>
                <Info size={14} />
                Anda sedang melihat struktur parameter historis ({MONTHS.find(m => m.value === paramViewMonth)?.label} {paramViewYear}). Untuk menambah/hapus parameter, kembali ke bulan ini.
              </div>
            )}

            {/* Tree Rendering */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {parameters.map((parent, pIdx) => renderParameterNode(parent, 0, pIdx, parameters, isEditMode))}
            </div>
          </div>

        </div>
      )}

      {/* PARAMETER CREATION / UPDATE MODAL */}
      {showParamModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '650px', padding: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {modalMode === 'create' 
                  ? (paramParentId ? `Tambah Sub-Parameter di bawah ${findParamById(Number(paramParentId), parameters)?.nama || ''}` : 'Tambah Parameter Utama') 
                  : (paramParentId ? 'Ubah Sub-Parameter' : 'Ubah Parameter Utama')}
              </h3>
              <button onClick={() => setShowParamModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveParameter} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nama Parameter</label>
                  <input 
                    type="text" 
                    value={paramName} 
                    onChange={(e) => setParamName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                    placeholder="Contoh: KEANDALAN SISTEM"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bobot (%) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- opsional</span></label>
                  <input 
                    type="number" step="any"
                    value={paramBobot} 
                    onChange={(e) => setParamBobot(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                    placeholder="Otomatis dari sub-parameter"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Polaritas <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- opsional</span></label>
                  <select
                    value={paramPolaritas}
                    onChange={(e) => setParamPolaritas(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    <option value="">-- Pilih Polaritas --</option>
                    <option value="MAXIMIZE">Positif</option>
                    <option value="MINIMIZE">Negatif</option>
                    <option value="RANGE">Range</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Satuan Pengukuran <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>- opsional</span></label>
                  <select 
                    value={paramSatuan} 
                    onChange={(e) => setParamSatuan(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    <option value="">-- Pilih Satuan --</option>
                    {SATUAN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-parameter elements (only shown when creating a new parent) */}
              {modalMode === 'create' && !paramParentId && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Daftar Sub-Parameter</span>
                    <button 
                      type="button" 
                      onClick={handleAddChildRow}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 8px', borderRadius: 6, border: '1px solid #14A2BA',
                        background: 'transparent', color: '#14A2BA', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                      }}
                      className="hover:bg-slate-50 transition"
                    >
                      <Plus size={14} />
                      Tambah Sub Parameter
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {paramChildren.map((child, idx) => (
                      <div key={idx} style={{ 
                        display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr auto', gap: '8px', alignItems: 'center',
                        padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)'
                      }}>
                        <input 
                          type="text" placeholder="Nama Sub"
                          value={child.nama} onChange={(e) => handleChildChange(idx, 'nama', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                          required
                        />
                        <select 
                          value={child.polaritas} onChange={(e) => handleChildChange(idx, 'polaritas', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                        >
                          <option value="">- Polaritas -</option>
                          <option value="MAXIMIZE">Positif</option>
                          <option value="MINIMIZE">Negatif</option>
                          <option value="RANGE">Range</option>
                        </select>
                        <select 
                          value={child.satuan} onChange={(e) => handleChildChange(idx, 'satuan', e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                        >
                          <option value="">- Satuan -</option>
                          {SATUAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input 
                          type="number" step="any" placeholder="Bobot"
                          value={child.bobot} onChange={(e) => handleChildChange(idx, 'bobot', e.target.value === '' ? '' : Number(e.target.value))}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <button 
                          type="button" onClick={() => handleRemoveChildRow(idx)} disabled={paramChildren.length === 1}
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: paramChildren.length === 1 ? 0.3 : 1 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Weight validation indicator inside modal */}
                  {!paramParentId ? (
                    <div style={{ 
                      marginTop: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                      background: childrenWeightsSum <= paramBobot ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: childrenWeightsSum <= paramBobot ? '#10B981' : '#EF4444',
                      border: `1px solid ${childrenWeightsSum <= paramBobot ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                      display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>Kumulatif Bobot Sub-Parameter:</span>
                      <span>{childrenWeightsSum.toFixed(2)}% / {Number(paramBobot).toFixed(2)}%</span>
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                      background: (siblingWeightsSum + Number(paramBobot)) <= (parameters.find(p => p.id === Number(paramParentId))?.bobot || 0) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: (siblingWeightsSum + Number(paramBobot)) <= (parameters.find(p => p.id === Number(paramParentId))?.bobot || 0) ? '#10B981' : '#EF4444',
                      border: `1px solid ${(siblingWeightsSum + Number(paramBobot)) <= (parameters.find(p => p.id === Number(paramParentId))?.bobot || 0) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                      display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>Kumulatif Bobot Sub-Parameter:</span>
                      <span>{(siblingWeightsSum + Number(paramBobot)).toFixed(2)}% / {(parameters.find(p => p.id === Number(paramParentId))?.bobot || 0).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}



              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowParamModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    (modalMode === 'create' && !paramParentId && childrenWeightsSum > paramBobot) ||
                    (() => {
                      if (!paramParentId) return false
                      const parentObj = findParamById(Number(paramParentId), parameters)
                      const parentBobot = parentObj?.bobot || 0
                      // Only block if parent has a set bobot (> 0) and we're exceeding it
                      if (parentBobot <= 0) return false
                      return (siblingWeightsSum + Number(paramBobot)) > parentBobot
                    })()
                  }
                  style={{ 
                    padding: '10px 20px', borderRadius: '8px', background: '#14A2BA', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer',
                    opacity: (
                      (modalMode === 'create' && !paramParentId && childrenWeightsSum > paramBobot) ||
                      (() => {
                        if (!paramParentId) return false
                        const parentObj = findParamById(Number(paramParentId), parameters)
                        const parentBobot = parentObj?.bobot || 0
                        if (parentBobot <= 0) return false
                        return (siblingWeightsSum + Number(paramBobot)) > parentBobot
                      })()
                    ) ? 0.6 : 1
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOFT DELETE CONFIRMATION WARNING MODAL */}
      {deleteConfirm.show && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.4)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContents: 'center'
        }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444', marginBottom: '16px' }}>
              <AlertTriangle size={28} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Konfirmasi Hapus Parameter</h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              {deleteConfirm.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null, hasHistory: false, message: '' })}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteParam(deleteConfirm.id, true)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#EF4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Ya, Tetap Hapus (Soft Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles details */}
      <style>{`
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Table Helper Styles ────────────────────────────────────────────
function thStyle(overrides = {}) {
  return {
    padding: '12px 10px',
    fontSize: '0.725rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'normal',
    lineHeight: 1.3,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'var(--bg-elevated)',
    boxShadow: 'inset 0 -1px 0 var(--border)',
    ...overrides,
  }
}

function tdStyle(overrides = {}) {
  return {
    padding: '12px 10px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    borderTop: '1px solid var(--border)',
    ...overrides,
  }
}
