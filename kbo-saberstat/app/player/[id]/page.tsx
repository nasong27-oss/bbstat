'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const STAT_DESC: Record<string, string> = {
  WAR: '대체선수 대비 승리 기여. 7↑엘리트, 5↑올스타, 2↑주전',
  'wRC+': '조정 득점 기여율. 100=리그평균, 130↑엘리트',
  wOBA: '가중 출루율. 리그평균 ~.330',
  BABIP: '인플레이 타구 타율. 평균 .300~.310',
  ISO: '순수 장타력. .200↑파워히터',
  'BB%': '볼넷 비율. 10%↑우수',
  'K%': '삼진 비율. 낮을수록 좋음',
  FIP: '수비무관 방어율. ERA보다 실력을 정확히 반영',
  xFIP: 'HR 보정 FIP. 장기 실력 예측에 유용',
  'K/9': '9이닝당 탈삼진. 9↑우수',
  'BB/9': '9이닝당 볼넷. 낮을수록 좋음',
  'LOB%': '잔루율. 평균 70~72%',
  'K/BB': '탈삼진/볼넷 비율. 3↑우수',
}

function StatCard({ label, value, format = 'num' }: { label: string; value: number; format?: 'num'|'pct'|'avg'|'int' }) {
  const [tip, setTip] = useState(false)
  const display = () => {
    if (value === 0) return '-'
    if (format === 'avg') return value.toFixed(3).replace('0.', '.')
    if (format === 'pct') return value.toFixed(1) + '%'
    if (format === 'int') return Math.round(value).toString()
    return value.toFixed(2)
  }
  const color = label === 'WAR'
    ? (value >= 6 ? 'var(--accent)' : value >= 3 ? '#86efac' : value >= 1 ? 'var(--text)' : value >= 0 ? 'var(--amber)' : 'var(--red)')
    : label === 'wRC+'
    ? (value >= 140 ? 'var(--accent)' : value >= 115 ? '#86efac' : value >= 85 ? 'var(--text)' : value >= 70 ? 'var(--amber)' : 'var(--red)')
    : 'var(--text)'

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '1rem', position: 'relative' }}>
      <div className="text-xs cursor-help" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.05em', borderBottom: STAT_DESC[label] ? '1px dashed var(--border)' : 'none', display: 'inline-block' }}
        onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
        {label}
      </div>
      {tip && STAT_DESC[label] && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#111', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem', zIndex: 999, minWidth: 200, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', whiteSpace: 'normal' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{label}</span><br/>{STAT_DESC[label]}
        </div>
      )}
      <div className="font-stat text-2xl font-semibold mt-2" style={{ color }}>{display()}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div style={{ width: 3, height: 18, background: 'var(--accent)', borderRadius: 2 }} />
      <h3 className="font-display text-lg tracking-wider" style={{ color: 'var(--text-muted)' }}>{children}</h3>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatsData = Record<string, any>

export default function PlayerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const playerId = params.id as string
  const type = searchParams.get('type') as 'batter' | 'pitcher' || 'batter'
  const playerName = searchParams.get('name') || ''

  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [activeType, setActiveType] = useState(type)

  const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    setLoading(true); setError('')
    fetch(`/api/players?id=${playerId}&type=${activeType}&year=${year}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setStats(d.stats) })
      .catch(() => setError('로딩 실패'))
      .finally(() => setLoading(false))
  }, [playerId, activeType, year])

  const radarData = stats ? (activeType === 'batter' ? [
    { stat: 'wRC+', value: Math.min(100, ((stats.wrcPlus||0)/160)*100) },
    { stat: 'OBP', value: Math.min(100, ((stats.obp||0)/0.45)*100) },
    { stat: 'ISO', value: Math.min(100, ((stats.iso||0)/0.28)*100) },
    { stat: 'BB%', value: Math.min(100, ((stats.bbPct||0)/15)*100) },
    { stat: 'K%↓', value: Math.max(0, 100-((stats.kPct||0)/30)*100) },
    { stat: 'WAR', value: Math.min(100, Math.max(0,((stats.war||0)+1)/9*100)) },
  ] : [
    { stat: 'FIP', value: Math.max(0, 100-((stats.fip||4)/7)*100) },
    { stat: 'K/9', value: Math.min(100, ((stats.kPer9||0)/12)*100) },
    { stat: 'BB%↓', value: Math.max(0, 100-((stats.bbPct||10)/15)*100) },
    { stat: 'GB%', value: Math.min(100, ((stats.gbPct||0)/60)*100) },
    { stat: 'LOB%', value: Math.min(100, ((stats.lobPct||70)/85)*100) },
    { stat: 'WAR', value: Math.min(100, Math.max(0,((stats.war||0)+1)/9*100)) },
  ]) : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="tag tag-team">{stats?.team || '-'}</span>
            <span className="tag tag-pos">{stats?.position || stats?.role || '-'}</span>
          </div>
          <h1 className="font-display text-5xl" style={{ color: 'var(--text)' }}>
            {stats?.name || playerName || `#${playerId}`}
          </h1>
        </div>
        <div className="flex gap-2">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex' }}>
            {(['batter', 'pitcher'] as const).map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: activeType === t ? 'var(--accent-dim)' : 'transparent', color: activeType === t ? 'var(--accent)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', borderRadius: 5, fontFamily: 'Noto Sans KR, sans-serif' }}>
                {t === 'batter' ? '타자' : '투수'}
              </button>
            ))}
          </div>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>스태티즈에서 실시간 데이터 수집 중...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--red)' }}>{error}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>해당 시즌 데이터가 없거나 스태티즈 접근 오류일 수 있어요</p>
        </div>
      )}

      {stats && !loading && (
        <div className="animate-fadeUp">
          {/* WAR 하이라이트 바 */}
          <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>WAR · {year}시즌</div>
              <div className="font-display text-6xl mt-1" style={{ color: 'var(--accent)' }}>{(stats.war||0).toFixed(1)}</div>
            </div>
            {activeType === 'batter' && <>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>wRC+</div><div className="font-stat text-3xl mt-1">{(stats.wrcPlus||0).toFixed(0)}</div></div>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>OPS</div><div className="font-stat text-3xl mt-1">{(stats.ops||0).toFixed(3).replace('0.', '.')}</div></div>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>wOBA</div><div className="font-stat text-3xl mt-1">{(stats.woba||0).toFixed(3).replace('0.', '.')}</div></div>
            </>}
            {activeType === 'pitcher' && <>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>FIP</div><div className="font-stat text-3xl mt-1">{(stats.fip||0).toFixed(2)}</div></div>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>ERA</div><div className="font-stat text-3xl mt-1">{(stats.era||0).toFixed(2)}</div></div>
              <div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>K/9</div><div className="font-stat text-3xl mt-1">{(stats.kPer9||0).toFixed(2)}</div></div>
            </>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
              <SectionTitle>능력치 레이더</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name="stats" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
              <SectionTitle>핵심 세이버메트릭스</SectionTitle>
              {activeType === 'batter' ? (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="WAR" value={stats.war||0} />
                  <StatCard label="wRC+" value={stats.wrcPlus||0} format="int" />
                  <StatCard label="wOBA" value={stats.woba||0} format="avg" />
                  <StatCard label="BABIP" value={stats.babip||0} format="avg" />
                  <StatCard label="ISO" value={stats.iso||0} format="avg" />
                  <StatCard label="BB%" value={stats.bbPct||0} format="pct" />
                  <StatCard label="K%" value={stats.kPct||0} format="pct" />
                  <StatCard label="wRAA" value={stats.wraa||0} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="WAR" value={stats.war||0} />
                  <StatCard label="FIP" value={stats.fip||0} />
                  <StatCard label="xFIP" value={stats.xfip||0} />
                  <StatCard label="SIERA" value={stats.siera||0} />
                  <StatCard label="K/9" value={stats.kPer9||0} />
                  <StatCard label="BB/9" value={stats.bbPer9||0} />
                  <StatCard label="K/BB" value={stats.kBb||0} />
                  <StatCard label="LOB%" value={stats.lobPct||0} format="pct" />
                </div>
              )}
            </div>
          </div>

          {/* 클래식 스탯 */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', overflowX: 'auto' }}>
            <SectionTitle>클래식 스탯</SectionTitle>
            {activeType === 'batter' ? (
              <table className="stat-table">
                <thead><tr>{['G','PA','AB','AVG','OBP','SLG','OPS','H','2B','3B','HR','RBI','R','SB','BB','K'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody><tr>
                  <td>{stats.games||'-'}</td><td>{stats.pa||'-'}</td><td>{stats.ab||'-'}</td>
                  <td>{stats.avg?(stats.avg).toFixed(3).replace('0.','.'):'-'}</td>
                  <td>{stats.obp?(stats.obp).toFixed(3).replace('0.','.'):'-'}</td>
                  <td>{stats.slg?(stats.slg).toFixed(3).replace('0.','.'):'-'}</td>
                  <td style={{color:'var(--accent)'}}>{stats.ops?(stats.ops).toFixed(3).replace('0.','.'):'-'}</td>
                  <td>{stats.hits||'-'}</td><td>{stats.doubles||'-'}</td><td>{stats.triples||'-'}</td>
                  <td>{stats.hr||'-'}</td><td>{stats.rbi||'-'}</td><td>{stats.runs||'-'}</td>
                  <td>{stats.sb||'-'}</td><td>{stats.bb||'-'}</td><td>{stats.so||'-'}</td>
                </tr></tbody>
              </table>
            ) : (
              <table className="stat-table">
                <thead><tr>{['G','W','L','SV','HLD','IP','ERA','WHIP','H','HR','BB','K','ER'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody><tr>
                  <td>{stats.games||'-'}</td><td>{stats.wins||'-'}</td><td>{stats.losses||'-'}</td>
                  <td>{stats.saves||'-'}</td><td>{stats.holds||'-'}</td>
                  <td>{stats.ip?(stats.ip).toFixed(1):'-'}</td>
                  <td style={{color:'var(--accent)'}}>{stats.era?(stats.era).toFixed(2):'-'}</td>
                  <td>{stats.whip?(stats.whip).toFixed(3):'-'}</td>
                  <td>{stats.hits||'-'}</td><td>{stats.hr||'-'}</td>
                  <td>{stats.bb||'-'}</td><td>{stats.so||'-'}</td><td>{stats.er||'-'}</td>
                </tr></tbody>
              </table>
            )}
          </div>

          <div className="mt-6 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
            데이터: statiz.sporki.com · {new Date().toLocaleDateString('ko-KR')} 기준
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
