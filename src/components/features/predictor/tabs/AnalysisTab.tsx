import type { AiOutputLine, PredictionResult } from '../types'
import { S } from '../styles'

type Props = {
  aiRunning: boolean
  aiOutput: AiOutputLine[]
  aiProgress: number
  runAI: () => void
  result: PredictionResult
}

const LINE_COLORS: Record<AiOutputLine['type'], string> = {
  result:  '#4ade80',
  warning: '#fb923c',
  data:    '#60a5fa',
  success: '#34d399',
  info:    '#94a3b8',
}

export function AnalysisTab({ aiRunning, aiOutput, aiProgress, runAI }: Props) {
  return (
    <div style={S.g2}>
      <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={S.ct}>AI Market Intelligence Engine</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          Fetches live signals from Rubber Board, SE Asia weather, China demand indicators, crude markets and shipping indices — runs multi-factor weighted model for daily and monthly price forecast.
        </div>
        <button
          onClick={runAI}
          disabled={aiRunning}
          style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 7, fontSize: 12, fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}>
          {aiRunning ? '⟳ Analyzing...' : '▶ Run AI Analysis'}
        </button>
        {aiRunning && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 4 }}>
              <span>Processing</span><span>{aiProgress}%</span>
            </div>
            <div style={{ height: 4, background: '#1a2744', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${aiProgress}%`, height: '100%', background: 'linear-gradient(90deg,#38bdf8,#818cf8)', transition: 'width 0.4s', borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ ...S.card, background: '#060810' }}>
        <div style={S.ct}>AI Terminal Output</div>
        <div style={{ minHeight: 260 }}>
          {aiOutput.length === 0 && (
            <div style={{ color: '#334155', paddingTop: 20, textAlign: 'center', fontSize: 11 }}>Click "Run AI Analysis" to start →</div>
          )}
          {aiOutput.map((line, i) => {
            const c = LINE_COLORS[line.type]
            const isResult = line.type === 'result'
            return (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', color: c, lineHeight: 1.6, borderLeft: isResult ? '2px solid #4ade80' : 'none', paddingLeft: isResult ? 10 : 0 }}>
                {line.text}
              </div>
            )
          })}
          {aiRunning && <span style={{ color: '#38bdf8', animation: 'pulse 0.8s infinite' }}>█</span>}
        </div>
      </div>
    </div>
  )
}
