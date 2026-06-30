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

      <div className="main-content" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background decorations */}
        <div className="bg-decorations" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {/* Top-left soft gradient */}
          <div style={{
            position: 'absolute', width: 450, height: 450, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 162, 186,0.04) 0%, transparent 70%)',
            top: -100, left: -100,
          }} />
          
          {/* Bottom-right soft gradient */}
          <div style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 162, 186,0.06) 0%, transparent 70%)',
            bottom: -200, right: -100,
          }} />

          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(20, 162, 186,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 162, 186,0.012) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Wavy Curve SVG at bottom */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', opacity: 0.08, fill: 'none' }} viewBox="0 0 1440 200">
            <path fill="url(#wave-grad)" d="M0,96L80,112C160,128,320,160,480,165.3C640,171,800,149,960,128C1120,107,1280,85,1360,74.7L1440,64L1440,200L1360,200C1280,200,1120,200,960,200C800,200,640,200,480,200C320,200,160,200,80,200L0,200Z" />
            <defs>
              <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14A2BA" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#14A2BA" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Dot patterns */}
          <svg width="100" height="100" style={{ position: 'absolute', top: '10%', right: '5%', opacity: 0.12 }} viewBox="0 0 100 100">
            <pattern id="dot-pattern-layout" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#14A2BA" />
            </pattern>
            <rect width="100" height="100" fill="url(#dot-pattern-layout)" />
          </svg>

          {/* Transmission tower illustration on the right side */}
          <svg style={{ position: 'absolute', right: '4%', bottom: '5%', height: '40%', width: 'auto', opacity: 0.035 }} viewBox="0 0 400 800" fill="none" stroke="#14A2BA" strokeWidth="4">
            <path d="M120 750 L280 750 M140 750 L180 500 L220 500 L260 750 M180 500 L190 300 L210 300 L220 500 M190 300 L195 100 L205 100 L210 300 M195 100 L200 20 L205 100" />
            <path d="M150 620 L250 620 M170 500 L230 500 M185 380 L215 380 M190 300 L210 300 M193 200 L207 200" />
            <path d="M80 380 L320 380 M100 300 L300 300 M120 200 L280 200" />
            <path d="M140 750 L220 500 M260 750 L180 500 M180 500 L210 300 M220 500 L190 300 M190 300 L205 100 M210 300 L195 100" />
            <path d="M150 620 L180 500 M250 620 L220 500 M170 500 L190 380 M230 500 L210 380 M185 380 L195 300 M215 380 L205 300" />
          </svg>
        </div>

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
