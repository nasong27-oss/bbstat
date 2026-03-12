'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string; name: string; team: string; position: string;
  type: 'batter' | 'pitcher';
}

const KBO_TEAMS = ['KIA', '삼성', 'LG', 'NC', '두산', 'SSG', '롯데', '키움', 'KT', '한화']

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true); setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20" style={{ minHeight: '70vh' }}>
        <div className="text-center mb-12">
          <div className="font-display text-xs tracking-[0.4em] mb-4" style={{ color: 'var(--text-muted)' }}>
            KBO LEAGUE · SABERMETRICS
          </div>
          <h1 className="font-display mb-4" style={{ fontSize: 'clamp(4rem, 15vw, 9rem)', color: 'var(--text)', lineHeight: 0.9 }}>
            KBO<br />
            <span style={{ color: 'var(--accent)' }}>STAT</span>
          </h1>
          <p className="text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            선수 이름으로 검색 · 세이버메트릭스 풀셋 조회
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'visible' }}>
            <div className="flex items-center px-4 py-3 gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text" value={query} onChange={handleInput}
                onKeyDown={e => e.key === 'Enter' && search(query)}
                placeholder="선수 이름 검색 (예: 이정후, 류현진)"
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '1rem', width: '100%', fontFamily: "'Noto Sans KR', sans-serif" }}
              />
              {loading && <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />}
            </div>
          </div>

          {searched && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: 360, overflowY: 'auto' }}>
              {loading ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>스크래핑 중...</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>검색 결과 없음</div>
              ) : results.map((r, i) => (
                <button key={i}
                  onClick={() => router.push(`/player/${r.id}?type=${r.type}&name=${encodeURIComponent(r.name)}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ background: 'transparent', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', color: 'var(--text)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.team} · {r.position}</div>
                  </div>
                  <span className="ml-auto tag" style={{ background: r.type === 'pitcher' ? 'rgba(96,165,250,0.15)' : 'rgba(74,222,128,0.15)', color: r.type === 'pitcher' ? 'var(--blue)' : 'var(--accent)', fontSize: '0.6rem' }}>
                    {r.type === 'pitcher' ? '투수' : '타자'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <div className="text-xs mb-4 tracking-widest" style={{ color: 'var(--text-muted)' }}>구단별 탐색</div>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {KBO_TEAMS.map(team => (
              <a key={team} href={`/ranking?team=${encodeURIComponent(team)}`} className="tag tag-team" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
                {team}
              </a>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>데이터: statiz.sporki.com · 실시간 스크래핑</p>
      </footer>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
