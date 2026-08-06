import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertTriangle size={64} style={{ color: '#DC2626', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Terjadi kesalahan saat memuat halaman ini
          </h2>
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', width: '100%', maxWidth: '800px', overflow: 'auto', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <strong>{this.state.error?.toString()}</strong>
            <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '8px',
              background: '#0070C0', color: '#fff',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', border: 'none'
            }}
          >
            <RefreshCw size={16} />
            Muat Ulang Halaman
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
