import React, { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    localStorage.removeItem('sigap_theme')
  }, [])

  const dark = false
  const toggle = () => {}

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
