import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '이정후'
  const url = `https://statiz.sporki.com/player/?m=search&s=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://statiz.sporki.com/',
      },
      cache: 'no-store',
    })
    const html = await res.text()
    return NextResponse.json({
      status: res.status,
      url,
      htmlLength: html.length,
      htmlPreview: html.slice(0, 3000),
      hasTable: html.includes('<table'),
      hasPNo: html.includes('p_no'),
      hasTbody: html.includes('<tbody'),
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), url }, { status: 500 })
  }
}
