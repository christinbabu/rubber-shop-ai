import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

const API = 'http://localhost:4000'
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

type Grade = 'rss4' | 'rss5' | 'lot' | 'scrap'
const GRADES: { id: Grade; label: string }[] = [
  { id: 'rss4', label: 'RSS4' },
  { id: 'rss5', label: 'RSS5' },
  { id: 'lot', label: 'Lot' },
  { id: 'scrap', label: 'Scrap' },
]

type GradeRates = Partial<Record<Grade, number>>
type RateRecord = { rates: GradeRates; updatedAt: string }
type EmailSummary = { attempted: number; sent: number; failed: number }

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyInputs(): Record<Grade, string> {
  return { rss4: '', rss5: '', lot: '', scrap: '' }
}

type PurchaseRateSetterProps = {
  spotPrice: number | null
}

export function PurchaseRateSetter({ spotPrice }: PurchaseRateSetterProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [rates, setRates] = useState<Record<string, RateRecord>>({})
  const [loading, setLoading] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<Grade, string>>(emptyInputs())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null)

  const todayKey = toDateKey(today)
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  useEffect(() => {
    let cancelled = false
    async function fetchRates() {
      setLoading(true)
      try {
        const resp = await fetch(`${API}/api/purchase-rates?year=${viewYear}&month=${viewMonth + 1}`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!json.success || cancelled) return
        const map: Record<string, RateRecord> = {}
        for (const r of json.rates) map[r.date] = { rates: r.rates ?? {}, updatedAt: r.updatedAt }
        setRates(map)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load rates')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRates()
    return () => { cancelled = true }
  }, [viewYear, viewMonth])

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelectedKey(null)
  }

  function selectDate(dateKey: string) {
    setSelectedKey(dateKey)
    setError(null)
    setEmailSummary(null)
    const existing = rates[dateKey]?.rates
    setInputs({
      rss4: existing?.rss4 != null ? String(existing.rss4) : spotPrice ? String(spotPrice) : '',
      rss5: existing?.rss5 != null ? String(existing.rss5) : '',
      lot: existing?.lot != null ? String(existing.lot) : '',
      scrap: existing?.scrap != null ? String(existing.scrap) : '',
    })
  }

  async function handleSave() {
    if (!selectedKey) return
    const payload: GradeRates = {}
    for (const g of GRADES) {
      const raw = inputs[g.id]
      if (raw === '') continue
      const num = Number(raw)
      if (!Number.isFinite(num) || num <= 0) {
        setError(`Enter a valid ${g.label} rate greater than 0, or leave it blank.`)
        return
      }
      payload[g.id] = num
    }
    if (Object.keys(payload).length === 0) {
      setError('Set at least one grade rate.')
      return
    }

    setSaving(true)
    setError(null)
    setEmailSummary(null)
    try {
      const resp = await fetch(`${API}/api/purchase-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedKey, rates: payload }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.message || 'Failed to save rates')
      setRates((current) => ({ ...current, [selectedKey]: { rates: json.rates, updatedAt: json.updatedAt } }))
      setEmailSummary(json.emailed ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rates')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!selectedKey) return
    setSaving(true)
    setError(null)
    try {
      const resp = await fetch(`${API}/api/purchase-rates/${selectedKey}`, { method: 'DELETE' })
      const json = await resp.json()
      if (!json.success) throw new Error('Failed to clear rates')
      setRates((current) => {
        const next = { ...current }
        delete next[selectedKey]
        return next
      })
      setInputs(emptyInputs())
      setEmailSummary(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear rates')
    } finally {
      setSaving(false)
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay()
  const selectedRecord = selectedKey ? rates[selectedKey] : undefined
  const selectedDate = selectedKey ? new Date(`${selectedKey}T00:00:00`) : null

  return (
    <div className="card">
      <h2>Set Today's Purchase Rate</h2>
      <p>Pick a date on the calendar to set or update the RSS4, RSS5, Lot and Scrap rates you're paying farmers for rubber that day.</p>

      <div style={{ display: 'grid', gridTemplateColumns: selectedKey ? '1.4fr 1fr' : '1fr', gap: '1rem', alignItems: 'start' }}>
        <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => goMonth(-1)} style={navBtnStyle}>‹ Prev</button>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f9ff' }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            <button onClick={() => goMonth(1)} style={navBtnStyle}>Next ›</button>
          </div>
          {!isCurrentMonth && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <button
                onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedKey(null) }}
                style={{ ...navBtnStyle, fontSize: 11 }}
              >
                Jump to current month
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {DOW.map((d) => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#475569' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(viewYear, viewMonth, day)
              const dateKey = toDateKey(date)
              const record = rates[dateKey]
              const gradeCount = record ? Object.keys(record.rates).length : 0
              const isToday = dateKey === todayKey
              return (
                <button
                  key={dateKey}
                  onClick={() => selectDate(dateKey)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '6px 2px', minHeight: 56, borderRadius: 8, cursor: 'pointer',
                    background: isToday ? '#123049' : selectedKey === dateKey ? '#1a2744' : '#0b1621',
                    border: isToday ? '1px solid #38bdf8' : '1px solid #1a2744',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#64748b' }}>{day}</span>
                  {record?.rates.rss4 != null ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>₹{record.rates.rss4}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#334155' }}>—</span>
                  )}
                  {gradeCount > 0 && (
                    <span style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{gradeCount} grade{gradeCount > 1 ? 's' : ''}</span>
                  )}
                </button>
              )
            })}
          </div>
          {loading && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Loading rates…</div>}
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 10, textAlign: 'center' }}>
            Green price = RSS4 rate already set for that day (shown as the headline rate) · Click any date to set or edit all grades
          </div>
        </div>

        {selectedKey && selectedDate && (
          <div style={{ padding: '1rem', background: '#08111b', border: '1px solid #1a2744', borderRadius: 10 }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {selectedKey === todayKey ? ' (today)' : ''}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f9ff', marginTop: 6, marginBottom: 12 }}>
              {selectedRecord && Object.keys(selectedRecord.rates).length > 0 ? 'Edit rates' : 'No rates set yet'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {GRADES.map((g) => (
                <label key={g.id} style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{g.label} (₹/kg)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={inputs[g.id]}
                    onChange={(e) => setInputs((cur) => ({ ...cur, [g.id]: e.target.value }))}
                    placeholder={g.id === 'rss4' && spotPrice ? `e.g. ${spotPrice}` : '—'}
                    style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #1a2744', background: '#0b1621', color: '#e2e8f0', fontSize: 14 }}
                  />
                </label>
              ))}
            </div>
            {spotPrice && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Today's live market spot (Kottayam): ₹{spotPrice}/kg</div>
            )}

            {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{error}</div>}
            {emailSummary && !error && (
              <div style={{ fontSize: 12, color: emailSummary.sent > 0 ? '#4ade80' : '#94a3b8', marginBottom: 10 }}>
                Saved.{' '}
                {emailSummary.attempted === 0
                  ? 'No customer emails on file yet.'
                  : `Emailed ${emailSummary.sent}/${emailSummary.attempted} customer${emailSummary.attempted > 1 ? 's' : ''}${emailSummary.failed ? ` (${emailSummary.failed} failed)` : ''}.`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save & notify customers'}
              </button>
              {selectedRecord && Object.keys(selectedRecord.rates).length > 0 && (
                <button onClick={handleClear} disabled={saving} style={{ ...navBtnStyle, opacity: saving ? 0.6 : 1 }}>
                  Clear
                </button>
              )}
            </div>

            {selectedRecord && (
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 10 }}>
                Last updated {new Date(selectedRecord.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const navBtnStyle: CSSProperties = {
  background: '#0b1621',
  border: '1px solid #1a2744',
  color: '#e2e8f0',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 13,
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  background: '#38bdf8',
  border: '1px solid #38bdf8',
  color: '#08111b',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}
