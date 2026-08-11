import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Target, Clock, Zap, Battery, AlertTriangle,
  Users, Plug, ShoppingCart, Wallet, TrendingDown, Search,
  Settings, Briefcase, FileText, Building2, ChevronDown, X,
  Home, Info, TrendingUp, Activity, ChevronRight,
  ShieldCheck, ClipboardList, CheckSquare, BookOpen, Bell,
  MessageSquare, BarChart2, AlertCircle, AlertOctagon, Download, Tag
} from 'lucide-react'
import { NAV_ITEMS } from '@/utils/constants'
import { useAuth } from '@/context/AuthContext'
import PlnLogo from '@/components/ui/PlnLogo'

const ICON_MAP = {
  LayoutDashboard, Target, Clock, Zap, Battery, AlertTriangle,
  Users, Plug, ShoppingCart, Wallet, TrendingDown, Search,
  Settings, Briefcase, FileText, Building2, Home, Info, TrendingUp, Activity,
  ShieldCheck, ClipboardList, CheckSquare, BookOpen, Bell,
  MessageSquare, BarChart2, AlertCircle, AlertOctagon, Download, Tag
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState({})
  const { user, isAdmin } = useAuth()

  const toggle = (g) => setCollapsed(p => ({ ...p, [g]: !p[g] }))

  // ─── Helper: check if any path in nested items is active ──────────────────
  const isPathMatch = (path) => {
    if (!path) return false
    const itemPath   = path.split('?')[0]
    const itemSearch = path.includes('?') ? path.split('?')[1] : ''
    if (itemSearch) {
      const itemParams = new URLSearchParams(itemSearch)
      const locParams  = new URLSearchParams(location.search)
      let matches = location.pathname === itemPath
      itemParams.forEach((v, k) => { if (locParams.get(k) !== v) matches = false })
      return matches
    }
    return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(itemPath + '/'))
  }

  const isAnyChildActive = (items) => {
    if (!items) return false
    return items.some(child => {
      if (child.path && isPathMatch(child.path)) return true
      if (child.items) return isAnyChildActive(child.items)
      return false
    })
  }

  const getFilteredNavItems = () => {
    // Full admin → everything
    if (isAdmin) return NAV_ITEMS
    
    const roleMap = {
      'pic_jaringan': 'JARINGAN',
      'pic_pemasaran': 'PEMASARAN',
      'pic_transaksi_energi': 'TRANSAKSI ENERGI',
      'pic_pengadaan': 'PENGADAAN',
      'pic_niaga': 'NIAGA',
      'pic_keuangan': 'KEUANGAN',
      'pic_aset': 'ASET',
      'pic_k3': 'K3',
      'admin_k3': 'K3'
    };
    
    const isPerencanaan = user?.role === 'perencanaan';
    const userGroup = user ? roleMap[user.role] : null;
    
    return NAV_ITEMS.flatMap(item => {
      if (item.key === 'home') return [item];
      if (item.k3 && user?.role !== 'admin_k3' && user?.role !== 'pic_k3') return []; // Hide K3 groups for non-K3 PIC roles
      
      if (item.group === 'NKO') {
         // Hide NKO for roles that only have their own specific page / module
         const noNkoRoles = ['pic_jaringan', 'pic_pengadaan', 'pic_transaksi_energi', 'pic_k3', 'admin_k3'];
         if (user && noNkoRoles.includes(user.role)) return [];
         const filteredItems = item.items.filter(i => i.group !== 'KELOLA TARGET');
         return [{ ...item, items: filteredItems }];
      }

      if (item.group === 'PEGAWAI') {
         // Only admin and perencanaan see PEGAWAI
         if (user && !isAdmin && !isPerencanaan) return [];
         return [item];
      }
      
      // Flatten the specific KINERJA subgroup into top-level items
      if (item.group === 'KINERJA') {
         if (isPerencanaan) {
            return [item]; // Keep KINERJA nested subgroups just like Admin
         }
         
         if (!userGroup) return [];
         const matchingSubgroup = item.items.find(sub => sub.group === userGroup);
         if (!matchingSubgroup) return [];
         
         const itemsToRender = user && user.role === 'pic_transaksi_energi'
           ? matchingSubgroup.items.filter(subItem => subItem.key !== 'input-kpi-te')
           : user && user.role === 'pic_k3'
             ? matchingSubgroup.items.filter(subItem => subItem.key !== 'k3-nko')
             : matchingSubgroup.items;

         // Extract the items from the subgroup and render them flatly, but preserve nested groups
         return itemsToRender.map(subItem => ({ 
             ...subItem, 
             type: subItem.type || 'item' 
         }));
      }
      
      return [];
    });
  }

  const filteredItems = getFilteredNavItems();

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
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, boxShadow:'0 0 0 1px rgba(255,255,255,0.2)' }}>
              <PlnLogo size={36} showText={false} />
            </div>
            <div>
              <div style={{ fontSize:'0.8125rem', fontWeight:800, color:'#FFFFFF', lineHeight:1.2 }}>SIGAP PLN</div>
              <div style={{ fontSize:'0.6rem', color:'#FFE000', fontWeight:600, letterSpacing:'0.04em', marginTop:1 }}>UP3 Kebon Jeruk</div>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="md:hidden btn-ghost"
            style={{ width:28, height:28, padding:0, borderRadius:8, color:'#FFFFFF' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, minHeight: 0, padding:'8px 0 12px', overflowY:'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredItems.map((item) => {
              const renderItem = (navItem, depth = 0) => {
                if (navItem.type === 'item' || (!navItem.type && navItem.path)) {
                  const IconComp = ICON_MAP[navItem.icon] || LayoutDashboard
                  const isActive = isPathMatch(navItem.path)
                  
                  return (
                    <li key={navItem.key}>
                      <NavLink
                        to={navItem.path}
                        onClick={(e) => {
                          if (window.sigap_block_navigation) {
                            e.preventDefault();
                            alert('Harap simpan perubahan parameter Anda terlebih dahulu dengan mengklik tombol "Simpan Perubahan".');
                            return;
                          }
                          onMobileClose();
                        }}
                        className={() => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                        style={{ paddingLeft: 16 + (depth * 24) }}
                      >
                        {depth === 0 ? (
                          <IconComp
                            size={15}
                            style={{
                              color: isActive ? 'inherit' : 'rgba(255, 255, 255, 0.65)',
                              flexShrink: 0,
                              transition: 'color 0.15s',
                            }}
                          />
                        ) : null}
                        <span style={{ fontSize:'0.8125rem' }}>{navItem.label}</span>
                      </NavLink>
                    </li>
                  )
                }

                if (navItem.type === 'group' || navItem.type === 'subgroup') {
                  const isCollapsed    = collapsed[navItem.group]
                  const IconComp       = navItem.icon ? ICON_MAP[navItem.icon] : null
                  const isChildActive  = isAnyChildActive(navItem.items)

                  return (
                    <div key={navItem.group}>
                      <button
                        className="sidebar-group-label"
                        onClick={() => toggle(navItem.group)}
                        style={{
                          paddingLeft: 16 + (depth * 24),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '8px',
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          paddingTop: '10px',
                          paddingBottom: '10px',
                          paddingRight: '16px',
                          color: isChildActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)'
                        }}
                      >
                        <ChevronDown
                          size={12}
                          style={{
                            transition: 'transform 0.2s',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                            flexShrink: 0,
                          }}
                        />
                        {IconComp && (
                          <IconComp
                            size={15}
                            style={{ flexShrink: 0 }}
                          />
                        )}
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.75rem', fontWeight: isChildActive ? 700 : 600 }}>{navItem.group}</span>
                      </button>

                      {!isCollapsed && (
                        <ul style={{ listStyle:'none', marginTop:2, padding: 0 }}>
                          {navItem.items.map(subItem => renderItem(subItem, depth + 1))}
                        </ul>
                      )}
                    </div>
                  )
                }
                return null
              }
              return renderItem(item)
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{
                width:6, height:6, borderRadius:'50%',
                background:'#10B981',
                boxShadow:'0 0 6px #10B98180',
              }} />
              <span style={{ fontSize:'0.65rem', color:'#34D399', fontWeight:600 }}>Sistem Online</span>
            </div>
            <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>
              © 2026 PT PLN (Persero)<br/>
              UP3 Kebon Jeruk · v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
