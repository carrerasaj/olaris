import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Olaris Fleet Intelligence Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #1a2744 0%, transparent 50%), radial-gradient(circle at 75% 75%, #0c4a6e 0%, transparent 50%)',
        }}
      >
        {/* Logo mark — two arcs with data points */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 32 32"
          fill="none"
          style={{ marginBottom: 32 }}
        >
          <path
            d="M16 3 A13 13 0 0 0 16 29"
            stroke="#06B6D4"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M16 3 A13 13 0 0 1 16 29"
            stroke="#22D3EE"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="4.5" cy="16" r="1.5" fill="#06B6D4" />
          <circle cx="27.5" cy="16" r="1.5" fill="#22D3EE" />
          <circle cx="16" cy="3" r="1.8" fill="#F1F5F9" />
          <circle cx="16" cy="29" r="1.8" fill="#F1F5F9" />
          <circle cx="16" cy="16" r="1.5" fill="#06B6D4" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#F1F5F9',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Olaris
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#06B6D4',
            marginBottom: 48,
          }}
        >
          Fleet Intelligence Platform
        </div>

        {/* Subtle divider */}
        <div
          style={{
            width: 120,
            height: 2,
            backgroundColor: '#06B6D4',
            opacity: 0.4,
            marginBottom: 32,
          }}
        />

        {/* URL */}
        <div
          style={{
            fontSize: 18,
            color: '#94A3B8',
            fontWeight: 400,
          }}
        >
          olaris.co.uk
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
