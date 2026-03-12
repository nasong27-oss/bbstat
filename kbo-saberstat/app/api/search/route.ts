import { NextRequest, NextResponse } from 'next/server'
import { searchPlayers } from '@/lib/scraper'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q) return NextResponse.json({ results: [] })
  try {
    const results = await searchPlayers(q)
    return NextResponse.json({ results })
  } catch (e: unknown) {
    console.error('Search API error:', e)
    return NextResponse.json({ results: [], error: String(e) }, { status: 500 })
  }
}
