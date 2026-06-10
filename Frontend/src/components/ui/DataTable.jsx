import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function DataTable({
  columns=[], data=[], searchable=true, paginated=true, pageSize=10,
  loading=false, onExport, emptyMessage='Tidak ada data', className='',
}) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged        = paginated ? filtered.slice((page-1)*pageSize, page*pageSize) : filtered

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <div className="skeleton" style={{ height:34, width:220, borderRadius:10, marginBottom:4 }} />
        {Array.from({length:5}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:44, width:'100%', borderRadius:8 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }} className={className}>
      {/* Toolbar */}
      {(searchable || onExport) && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          {searchable && (
            <div style={{ position:'relative' }}>
              <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft:36, width:240, height:38, fontSize:'0.92rem' }}
                placeholder="Cari data..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          )}
          {onExport && (
            <button
              className="btn-secondary"
              style={{ height:38, fontSize:'0.92rem', padding:'0 16px', display:'flex', alignItems:'center', gap:8 }}
              onClick={onExport}
            >
              <Download size={15} /> Export Excel
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width:col.width, textAlign: col.align==='right'?'right' : col.align==='center'?'center':'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign:'center', padding:'48px 16px', color:'var(--text-muted)', fontSize:'0.95rem' }}>
                  {search ? `Tidak ada hasil untuk "${search}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id ?? idx} className="animate-fade-in">
                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align==='right'?'right' : col.align==='center'?'center':'left' }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && filtered.length > pageSize && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.88rem', color:'var(--text-muted)' }}>
          <span>
            {(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)} dari {filtered.length} data
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button
              className="btn-ghost"
              style={{ width:34, height:34, padding:0, fontSize:'0.95rem' }}
              onClick={() => setPage(p => Math.max(1,p-1))}
              disabled={page===1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({length:Math.min(totalPages,5)},(_,i) => {
              let pn = i+1
              if (totalPages>5 && page>3) pn = page-2+i
              if (pn>totalPages) return null
              return (
                <button
                  key={pn}
                  onClick={() => setPage(pn)}
                  style={{
                    width:34, height:34, borderRadius:8, fontSize:'0.88rem', fontWeight:700,
                    border: page===pn ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                    background: page===pn ? 'var(--accent-soft)' : 'transparent',
                    color: page===pn ? '#38BDF8' : 'var(--text-muted)',
                    cursor:'pointer', transition:'all 0.15s',
                  }}
                >
                  {pn}
                </button>
              )
            })}
            <button
              className="btn-ghost"
              style={{ width:34, height:34, padding:0 }}
              onClick={() => setPage(p => Math.min(totalPages,p+1))}
              disabled={page===totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
