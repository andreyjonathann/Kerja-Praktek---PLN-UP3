import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Sun, RefreshCw, Menu, Bell, User, ChevronDown, LogOut, Shield } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth, ROLES } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { MONTHS, YEARS } from '@/utils/constants'
import { NAV_ITEMS } from '@/utils/constants'

export default function Header({ onMenuToggle, onRefresh, refreshing }) {
  const { dark, toggle }              = useTheme()
  const { user, logout }  = useAuth()
  const { filters, updateFilter }     = useFilter()
  const [userMenu, setUserMenu]       = useState(false)
  const [notifMenu, setNotifMenu]     = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Gangguan Penyulang Semeru',
      message: 'Trip di Gardu CK09 (Cengkareng Timur). Beban padam 1.45 MW, pelanggan padam 2,450.',
      time: '10 menit yang lalu',
      read: false,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Target SAIDI Mendekati Batas',
      message: 'Realisasi SAIDI YTD Mei 8.88 mnt/plg mendekati target tahunan 9.50 mnt/plg.',
      time: '1 jam yang lalu',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'Sinkronisasi Data Selesai',
      message: 'Laporan bulanan Mei 2026 telah disinkronisasikan oleh Admin.',
      time: '3 jam yang lalu',
      read: true,
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const location                      = useLocation()
  const breadcrumb                    = getBreadcrumb(location.pathname)

  const roleColor = {
    Admin:  { bg:'rgba(239,68,68,0.15)',   color:'#FCA5A5',  border:'rgba(239,68,68,0.25)'   },
    PIC:    { bg:'rgba(245,158,11,0.15)',  color:'#FCD34D',  border:'rgba(245,158,11,0.25)'  },
    Viewer: { bg:'rgba(16,185,129,0.15)', color:'#34D399',  border:'rgba(16,185,129,0.25)' },
  }
  const rc = roleColor[user?.role] || roleColor.Viewer

  return (
    <header className="page-header">
      {/* Left */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
        <button
          onClick={onMenuToggle}
          className="md:hidden btn-ghost"
          style={{ width:34, height:34, padding:0, borderRadius:8, flexShrink:0 }}
        >
          <Menu size={17} />
        </button>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          <span style={{ fontSize:'0.85rem', color:'rgba(255, 255, 255, 0.7)', fontWeight:700, letterSpacing:'0.04em', flexShrink:0 }}
                className="hidden sm:block">SIGAP</span>
          <span style={{ color:'rgba(255, 255, 255, 0.35)', fontSize:'0.9rem', flexShrink:0 }}
                className="hidden sm:block">/</span>
          <span style={{
            fontSize:'1rem', fontWeight:800, color:'#FFFFFF',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {breadcrumb}
          </span>
        </div>
      </div>

      {/* Center — Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }} className="hidden lg:flex">
        <FilterPill
          value={filters.year}
          onChange={v => updateFilter('year', Number(v))}
          options={YEARS.map(y => ({ value:y, label:String(y) }))}
          width={84}
        />
        <FilterPill
          value={filters.month}
          onChange={v => updateFilter('month', Number(v))}
          options={[{value:0,label:'Semua Bulan'}, ...MONTHS.map(m => ({value:m.value,label:m.label}))]}
          width={130}
        />
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="btn-ghost"
          style={{ width:34, height:34, padding:0, borderRadius:8 }}
          title="Refresh Data"
        >
          <RefreshCw size={15} style={{ color: refreshing ? '#FFE000' : '#FFFFFF' }}
                     className={refreshing ? 'animate-spin' : ''} />
        </button>



        {/* Bell */}
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <button
            onClick={() => setNotifMenu(p => !p)}
            className="btn-ghost"
            style={{
              width:34, height:34, padding:0, borderRadius:8, position:'relative',
              background: notifMenu ? 'rgba(255,255,255,0.15)' : 'transparent',
              border:`1px solid ${notifMenu ? 'rgba(255,255,255,0.25)' : 'transparent'}`,
            }}
            title="Notifikasi"
          >
            <Bell size={15} style={{ color:'#FFFFFF' }} />
            {unreadCount > 0 && (
              <span style={{
                position:'absolute', top:7, right:7, width:6, height:6,
                borderRadius:'50%', background:'#EF4444',
                boxShadow:'0 0 6px rgba(239,68,68,0.7)',
              }} />
            )}
          </button>

          {notifMenu && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:30 }} onClick={() => setNotifMenu(false)} />
              <div
                className="animate-slide-up"
                style={{
                  position:'absolute', right:0, top:'calc(100% + 6px)',
                  width:320, zIndex:40,
                  background:'var(--bg-elevated)', border:'1px solid var(--border-strong)',
                  borderRadius:12, boxShadow:'var(--shadow-lg)', overflow:'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)' }}>
                    Notifikasi {unreadCount > 0 && <span style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text-muted)' }}>({unreadCount})</span>}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background:'none', border:'none', padding:0,
                        fontSize:'0.75rem', fontWeight:700, color:'var(--pln-blue)',
                        cursor:'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                    >
                      Semua Dibaca
                    </button>
                  )}
                </div>

                {/* List Container */}
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border)',
                          background: n.read ? 'transparent' : 'var(--accent-soft)',
                          borderLeft: `3px solid ${n.type === 'critical' ? '#EF4444' : n.type === 'warning' ? '#F59E0B' : '#2563EB'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: 10 }}>{n.title}</span>
                          {!n.read && (
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%', background: '#EF4444',
                              boxShadow:'0 0 4px rgba(239,68,68,0.7)',
                              display: 'inline-block', flexShrink: 0, marginTop: 4
                            }} />
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35, whiteSpace:'normal', textAlign:'left' }}>{n.message}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                          {!n.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(n.id)
                              }}
                              style={{
                                background: 'none', border: 'none', padding: 0,
                                fontSize: '0.7rem', color: 'var(--pln-blue)', fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'center', background:'var(--bg-table-head)' }}>
                    <button
                      onClick={clearNotifications}
                      style={{
                        background:'none', border:'none', padding:0,
                        fontSize:'0.75rem', fontWeight:700, color:'#EF4444',
                        cursor:'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                    >
                      Hapus Semua
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ width:1, height:20, background:'rgba(255, 255, 255, 0.2)', margin:'0 4px' }} />

        {/* User Menu */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setUserMenu(p => !p)}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'5px 10px 5px 6px', borderRadius:10,
              background: userMenu ? 'rgba(255,255,255,0.15)' : 'transparent',
              border:`1px solid ${userMenu ? 'rgba(255,255,255,0.25)' : 'transparent'}`,
              cursor:'pointer', transition:'all 0.15s',
            }}
          >
            <div style={{
              width:28, height:28, borderRadius:8,
              background:'linear-gradient(135deg, #FFE000, #F59E0B)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              boxShadow:'0 0 12px rgba(255,224,0,0.4)',
            }}>
              <User size={13} style={{ color:'#0F172A' }} />
            </div>
            <div style={{ textAlign:'left' }} className="hidden sm:block">
              <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#FFFFFF', lineHeight:1.2 }}>
                {user?.name || 'User'}
              </div>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:3,
                fontSize:'0.75rem', fontWeight:700,
                color: rc.color === '#FCA5A5' ? '#FFC5C5' : rc.color === '#FCD34D' ? '#FFE895' : '#86EFAC',
                marginTop:2,
              }}>
                <Shield size={10} />
                {user?.role}
              </div>
            </div>
            <ChevronDown size={11} style={{ color:'#FFFFFF', transition:'transform 0.2s', transform: userMenu ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {userMenu && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:30 }} onClick={() => setUserMenu(false)} />
              <div
                className="animate-slide-up"
                style={{
                  position:'absolute', right:0, top:'calc(100% + 6px)',
                  width:220, zIndex:40,
                  background:'var(--bg-elevated)', border:'1px solid var(--border-strong)',
                  borderRadius:12, boxShadow:'var(--shadow-lg)', overflow:'hidden',
                }}
              >
                {/* User info */}
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{user?.name}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{user?.email}</div>
                </div>



                {/* Logout */}
                <button
                  onClick={() => { logout(); setUserMenu(false) }}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:8,
                    padding:'12px 14px', fontSize:'0.92rem', fontWeight:700,
                    color:'#FCA5A5', background:'transparent', border:'none', cursor:'pointer',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function FilterPill({ value, onChange, options, width }) {
  return (
    <div style={{ position:'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select"
        style={{
          height:38, width, fontSize:'0.85rem', padding:'0 28px 0 12px',
          background:'rgba(255,255,255,0.15)',
          border:'1px solid rgba(255,255,255,0.25)',
          borderRadius:8, color:'#FFFFFF',
          fontWeight: 600,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ color: '#0F172A' }}>{o.label}</option>)}
      </select>
      <ChevronDown
        size={13}
        style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          color:'rgba(255, 255, 255, 0.8)', pointerEvents:'none',
        }}
      />
    </div>
  )
}

function getBreadcrumb(pathname) {
  const getAllPaths = (items) => {
    let list = []
    items.forEach(item => {
      if (item.path) list.push(item)
      if (item.items) list.push(...getAllPaths(item.items))
    })
    return list
  }
  const all = getAllPaths(NAV_ITEMS)
  const found = all.find(item => item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))
  return found?.label || 'Dashboard'
}
