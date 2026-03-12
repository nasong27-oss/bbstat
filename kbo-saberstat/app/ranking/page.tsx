'use client'
import { useState } from 'react'

const BATTER_STATS = [
  { key: 'war', label: 'WAR' }, { key: 'wrcPlus', label: 'wRC+' },
  { key: 'woba', label: 'wOBA' }, { key: 'ops', label: 'OPS' },
  { key: 'hr', label: 'HR' }, { key: 'avg', label: 'AVG' },
  { key: 'obp', label: 'OBP' }, { key: 'iso', label: 'ISO' },
  { key: 'babip', label: 'BABIP' }, { key: 'bbPct', label: 'BB%' },
  { key: 'kPct', label: 'K%' }, { key: 'sb', label: 'SB' },
]
const PITCHER_STATS = [
  { key: 'war', label: 'WAR' }, { key: 'era', label: 'ERA' },
  { key: 'fip', label: 'FIP' }, { key: 'xfip', label: 'xFIP' },
  { key: 'kPer9', label: 'K/9' }, { key: 'bbPer9', label: 'BB/9' },
  { key: 'kBb', label: 'K/BB' }, { key: 'whip', label: 'WHIP' },
  { key: 'lobPct', label: 'LOB%' }, { key: 'kPct', label: 'K%' },
  { key: 'gbPct', label: 'GB%' }, { key: 'siera', label: 'SIERA' },
]

export default function RankingPage() {
  const [activeType, setActiveType] = useState<'batter'|'pitcher'>('batter')
  const [sortStat, setSortStat] = useState('war')
  const [minPA, setMinPA] = useState(100)
  const [minIP, setMinIP] = useState(30)
  const stats = activeType === 'batter' ? BATTER_STATS : PITCHER_STATS
  const year = new Date().getFullYear()

  const url = activeType === 'batter'
    ? `https://statiz.sporki.com/stats/?m=main&m2=batting&m3=default&year=${year}&pa=${minPA}&ob=${sortStat}`
    : `https://statiz.sporki.com/stats/?m=main&m2=pitching&m3=default&year=${year}&ip=${minIP}&ob=${sortStat}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="font-display text-xs tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>CUSTOM RANKING</div>
        <h1 className="font-display text-5xl" style={{ color: 'var(--text)' }}>랭킹 조회</h1>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>포지션</label>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, display: 'inline-flex' }}>
              {(['batter','pitcher'] as const).map(t => (
                <button key={t} onClick={() => { setActiveType(t); setSortStat('war') }}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: activeType===t ? 'var(--accent-dim)' : 'transparent', color: activeType===t ? 'var(--accent)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', borderRadius: 5, fontFamily: 'Noto Sans KR, sans-serif' }}>
                  {t === 'batter' ? '타자' : '투수'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
              {activeType === 'batter' ? `최소 타석: ${minPA}` : `최소 이닝: ${minIP}`}
            </label>
            <input type="range"
              min={activeType==='batter' ? 10 : 5} max={activeType==='batter' ? 400 : 150}
              step={activeType==='batter' ? 10 : 5}
              value={activeType==='batter' ? minPA : minIP}
              onChange={e => activeType==='batter' ? setMinPA(+e.target.value) : setMinIP(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>기준 스탯</label>
            <div className="flex flex-wrap gap-2">
              {stats.map(s => (
                <button key={s.key} onClick={() => setSortStat(s.key)}
                  style={{ padding: '0.3rem 0.75rem', borderRadius: 4, border: `1px solid ${sortStat===s.key ? 'var(--accent)' : 'var(--border)'}`, background: sortStat===s.key ? 'rgba(74,222,128,0.1)' : 'transparent', color: sortStat===s.key ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 6, padding: '0.75rem 1.5rem', fontSize: '0.9rem', textDecoration: 'none', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 500 }}>
            스태티즈에서 랭킹 보기 →
          </a>
        </div>
      </div>
    </div>
  )
}
