import React, { useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import Header  from './Header'

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [refreshing,  setRefreshing]   = useState(false)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // Trigger re-fetch via custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('sigap:refresh'))
    setTimeout(() => setRefreshing(false), 1500)
  }, [])

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Header
          onMenuToggle={() => setMobileOpen(p => !p)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
