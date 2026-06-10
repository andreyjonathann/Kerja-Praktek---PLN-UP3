import React from 'react'

/**
 * Official PLN Logo SVG Component
 * Accurately recreates:
 *  - Yellow square (#FFE000) background
 *  - Three cyan (#29B8E4) horizontal wavy lines (water/energy symbol)
 *  - Red (#E8001D) diagonal lightning bolt
 *  - Optional bold cyan "PLN" text below the square
 *
 * Props:
 *  size      – controls the width in px; height is calculated automatically
 *  showText  – show the "PLN" text below the square (default: false)
 *  className – additional CSS classes
 */
export default function PlnLogo({ className = '', size = 32, showText = false }) {
  // viewBox height depends on whether we render the text
  const VIEW_W = 200
  const VIEW_H = showText ? 284 : 200
  const height  = Math.round((size * VIEW_H) / VIEW_W)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={height}
      className={`inline-block ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Yellow square background ────────────────────────────────── */}
      <rect x="0" y="0" width="200" height="200" fill="#FFE000" rx="5" />

      {/* ── Three cyan wavy lines ───────────────────────────────────── */}
      {/*
          Each wave stripe is a closed path:
            top edge  → sine-like cubic-bezier going left→right
            right cap → vertical line
            bottom edge → same sine but phase-shifted (inverted) right→left
          Amplitude ≈ ±12px, stripe height ≈ 10px
      */}

      {/* Wave 1  – centre y = 76 */}
      <path
        d="
          M 8,76
          C 27,62 47,90 66,76
          C 85,62 105,90 124,76
          C 143,62 163,90 192,76
          L 192,86
          C 163,100 143,72 124,86
          C 105,100 85,72 66,86
          C 47,100 27,72 8,86
          Z"
        fill="#29B8E4"
      />

      {/* Wave 2  – centre y = 102 */}
      <path
        d="
          M 8,102
          C 27,88 47,116 66,102
          C 85,88 105,116 124,102
          C 143,88 163,116 192,102
          L 192,112
          C 163,126 143,98 124,112
          C 105,126 85,98 66,112
          C 47,126 27,98 8,112
          Z"
        fill="#29B8E4"
      />

      {/* Wave 3  – centre y = 128 */}
      <path
        d="
          M 8,128
          C 27,114 47,142 66,128
          C 85,114 105,142 124,128
          C 143,114 163,142 192,128
          L 192,138
          C 163,152 143,124 124,138
          C 105,152 85,124 66,138
          C 47,152 27,124 8,138
          Z"
        fill="#29B8E4"
      />

      {/* ── Red lightning bolt ──────────────────────────────────────── */}
      {/*
          Classic Z/S-shaped PLN lightning bolt.
          Coordinates (in 200×200 space):

            (72,20) ─────────── (118,20)     ← top edge
               \                    \
                \  upper section     \
                 \                    \
            (60,114) ─────── (98,104)  →  (138,104)   ← kink
                               \               \
                                \  lower sect.  \
                                 \               \
                            (78,186) ────── (96,186)   ← bottom tip

          Traversed clockwise starting from top-left:
      */}
      <path
        d="
          M 72,20
          L 118,20
          L 98,104
          L 138,104
          L 96,186
          L 78,186
          L 116,114
          L 60,114
          Z"
        fill="#E8001D"
      />

      {/* ── Optional "PLN" text ─────────────────────────────────────── */}
      {showText && (
        <text
          x="100"
          y="266"
          textAnchor="middle"
          fontFamily="'Arial Black', 'Arial Bold', Arial, Helvetica, sans-serif"
          fontWeight="900"
          fontSize="66"
          fill="#29B8E4"
          letterSpacing="13"
        >
          PLN
        </text>
      )}
    </svg>
  )
}
