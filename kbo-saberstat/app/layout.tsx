import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KBO 세이버스탯',
  description: 'KBO 리그 세이버메트릭스 실시간 조회',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}
          className="sticky top-0 z-50 px-6 py-3 flex items-center gap-6">
          <a href="/" className="font-display text-2xl tracking-widest" style={{ color: 'var(--accent)' }}>
            KBO<span style={{ color: 'var(--text-muted)' }}>STAT</span>
          </a>
          <div className="flex gap-4 ml-4">
            <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>홈</a>
            <a href="/ranking" className="text-sm" style={{ color: 'var(--text-muted)' }}>랭킹</a>
          </div>
          <div className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            실시간 · 스태티즈
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
