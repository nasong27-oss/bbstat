import { NextRequest, NextResponse } from 'next/server'
import { getBatterStats, getPitcherStats } from '@/lib/scraper'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const type = req.nextUrl.searchParams.get('type') as 'batter' | 'pitcher' || 'batter'
  const year = parseInt(req.nextUrl.searchParams.get('year') || String(new Date().getFullYear()))
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
  try {
    const stats = type === 'pitcher' ? await getPitcherStats(id, year) : await getBatterStats(id, year)
    if (!stats) return NextResponse.json({ error: '데이터 없음' }, { status: 404 })
    return NextResponse.json({ stats, type, year })
  } catch {
    return NextResponse.json({ error: '스크래핑 실패' }, { status: 500 })
  }
}
