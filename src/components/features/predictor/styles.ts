import type { CSSProperties } from 'react'

const card: CSSProperties = {
  background: '#0d1520',
  border: '1px solid #1a2744',
  borderRadius: 10,
  padding: '14px 16px',
}

export const S = {
  app: {
    background: '#080b10',
    minHeight: '100vh',
    fontFamily: "'DM Mono','Courier New',monospace",
    color: '#e2e8f0',
  } as CSSProperties,

  hdr: {
    background: '#0d1520',
    borderBottom: '1px solid #1a2744',
    padding: '13px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  } as CSSProperties,

  logo: {
    fontSize: 14,
    fontWeight: 700,
    color: '#38bdf8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  } as CSSProperties,

  tabs: {
    display: 'flex',
    gap: 3,
    padding: '10px 22px 0',
    borderBottom: '1px solid #1a2744',
    background: '#080b10',
    overflowX: 'auto',
  } as CSSProperties,

  body: {
    padding: '18px 22px',
    maxWidth: 1160,
    margin: '0 auto',
  } as CSSProperties,

  card,

  ct: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 9,
  } as CSSProperties,

  g2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 14,
  } as CSSProperties,

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#4ade80',
    display: 'inline-block',
    marginRight: 6,
    animation: 'pulse 1.5s infinite',
  } as CSSProperties,

  tab: (active: boolean): CSSProperties => ({
    padding: '8px 14px',
    fontSize: 10,
    fontFamily: "'DM Mono',monospace",
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: 'none',
    background: active ? '#1a2744' : 'transparent',
    color: active ? '#38bdf8' : '#64748b',
    cursor: 'pointer',
    borderRadius: '5px 5px 0 0',
    borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
    whiteSpace: 'nowrap',
  }),

  pill: (color: string): CSSProperties => ({
    fontSize: 10,
    padding: '2px 9px',
    borderRadius: 20,
    background: color + '22',
    color,
    border: `1px solid ${color}44`,
  }),

  sig: (signal: string): CSSProperties => ({
    fontSize: 10,
    padding: '3px 10px',
    borderRadius: 5,
    fontWeight: 700,
    background: signal === 'BUY' ? '#14532d' : signal === 'SELL' ? '#7f1d1d' : '#2b2110',
    color: signal === 'BUY' ? '#4ade80' : signal === 'SELL' ? '#f87171' : '#fb923c',
  }),
}
