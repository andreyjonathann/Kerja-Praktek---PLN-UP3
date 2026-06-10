import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Target, Clock, Zap, Battery, AlertTriangle,
  Users, Plug, ShoppingCart, Wallet, TrendingDown, Search,
  Settings, Briefcase, FileText, Building2, ChevronDown, X,
} from 'lucide-react'
import { NAV_ITEMS } from '@/utils/constants'
import PlnLogo from '@/components/ui/PlnLogo'

const ICON_MAP = {
  LayoutDashboard, Target, Clock, Zap, Battery, AlertTriangle,
  Users, Plug, ShoppingCart, Wallet, TrendingDown, Search,
  Settings, Briefcase, FileText, Building2,
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState({})

  const toggle = (g) => setCollapsed(p => ({ ...p, [g]: !p[g] }))

  return (
    <>
      {mobileOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
            zIndex:40, backdropFilter:'blur(4px)',
          }}
          className="md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, boxShadow:'0 0 0 1px rgba(255,255,255,0.1)' }}>
              <PlnLogo size={36} showText={false} />
            </div>
            <div>
              <div style={{ fontSize:'0.8125rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1.2 }}>SIGAP PLN</div>
              <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.04em', marginTop:1 }}>UP3 Kebon Jeruk</div>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="md:hidden btn-ghost"
            style={{ width:28, height:28, padding:0, borderRadius:8 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, minHeight: 0, padding:'8px 0 12px', overflowY:'auto' }}>
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <button
                className="sidebar-group-label"
                onClick={() => toggle(group.group)}
              >
                <span>{group.group}</span>
                <ChevronDown
                  size={10}
                  style={{
                    transition: 'transform 0.2s',
                    transform: collapsed[group.group] ? 'rotate(-90deg)' : 'rotate(0)',
                    color: 'var(--text-muted)',
                    marginRight: 10,
                  }}
                />
              </button>

              {!collapsed[group.group] && (
                <ul style={{ listStyle:'none', marginTop:2 }}>
                  {group.items.map((item) => {
                    const IconComp = ICON_MAP[item.icon] || LayoutDashboard
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path))

                    return (
                      <li key={item.key}>
                        <NavLink
                          to={item.path}
                          onClick={onMobileClose}
                          className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                        >
                          <IconComp
                            size={15}
                            style={{
                              color: isActive ? '#60A5FA' : 'var(--text-muted)',
                              flexShrink: 0,
                              transition: 'color 0.15s',
                            }}
                          />
                          <span style={{ fontSize:'0.8125rem' }}>{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{
                width:6, height:6, borderRadius:'50%',
                background:'#10B981',
                boxShadow:'0 0 6px #10B98180',
              }} />
              <span style={{ fontSize:'0.65rem', color:'#34D399', fontWeight:600 }}>Sistem Online</span>
            </div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', lineHeight:1.5 }}>
              © 2026 PT PLN (Persero)<br/>
              UP3 Kebon Jeruk · v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
