export interface BatterStats {
  name: string; team: string; position: string;
  games: number; pa: number; ab: number;
  avg: number; obp: number; slg: number; ops: number;
  hits: number; doubles: number; triples: number; hr: number;
  rbi: number; runs: number; sb: number; cs: number;
  bb: number; hbp: number; so: number; gdp: number;
  woba: number; wrcPlus: number; war: number; babip: number;
  iso: number; bbPct: number; kPct: number;
  spd: number; bsr: number; uzr: number; wraa: number;
}

export interface PitcherStats {
  name: string; team: string; role: string;
  games: number; wins: number; losses: number; saves: number; holds: number; ip: number;
  era: number; whip: number; so: number; bb: number; hits: number; hr: number; er: number;
  fip: number; xfip: number; war: number; babip: number;
  lobPct: number; kPer9: number; bbPer9: number; hrPer9: number;
  kBb: number; kPct: number; bbPct: number; gbPct: number; fbPct: number; siera: number;
}

export interface PlayerSearchResult {
  id: string; name: string; team: string; position: string;
  type: 'batter' | 'pitcher';
}

const STATIZ_BASE = 'https://statiz.sporki.com'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://statiz.sporki.com/',
}

function safeFloat(val: string | undefined, fallback = 0): number {
  if (!val) return fallback
  const n = parseFloat(val.replace(/,/g, '').trim())
  return isNaN(n) ? fallback : n
}

function safeInt(val: string | undefined, fallback = 0): number {
  if (!val) return fallback
  const n = parseInt(val.replace(/,/g, '').trim(), 10)
  return isNaN(n) ? fallback : n
}

export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  try {
    const url = `${STATIZ_BASE}/player/?m=search&s=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        'Cookie': '',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    })

    console.log('[search] status:', res.status, 'url:', url)

    if (!res.ok) {
      console.error('[search] HTTP error:', res.status, res.statusText)
      return []
    }

    const html = await res.text()
    console.log('[search] html length:', html.length, 'hasPNo:', html.includes('p_no'))

    const { load } = await import('cheerio')
    const $ = load(html)
    const results: PlayerSearchResult[] = []

    // statiz 선수 검색 결과 테이블 파싱
    $('table tbody tr').each((_, el) => {
      const cells = $(el).find('td')
      if (cells.length < 2) return
      // 첫 번째 셀 또는 전체 셀에서 링크 찾기
      const nameEl = $(el).find('a[href*="p_no"]').first()
      const href = nameEl.attr('href') || ''
      const name = nameEl.text().trim()
      const team = cells.length > 1 ? $(cells[1]).text().trim() : ''
      const position = cells.length > 2 ? $(cells[2]).text().trim() : ''
      const idMatch = href.match(/p_no=(\d+)/)
      const id = idMatch ? idMatch[1] : ''
      if (name && id) {
        const isPitcher = ['투수', 'P', 'SP', 'RP', 'CL'].some(r => position.includes(r))
        results.push({ id, name, team, position, type: isPitcher ? 'pitcher' : 'batter' })
      }
    })

    console.log('[search] table results:', results.length)

    // fallback: 링크에서 직접 파싱 (div/li 구조 등)
    if (results.length === 0) {
      const seen = new Set<string>()
      $('a[href*="p_no"]').each((_, el) => {
        const href = $(el).attr('href') || ''
        const idMatch = href.match(/p_no=(\d+)/)
        const id = idMatch ? idMatch[1] : ''
        if (!id || seen.has(id)) return
        const rawName = $(el).text().trim()
        // 이름처럼 보이는 텍스트만 (한글 2~5자 or 영문)
        const name = rawName.replace(/\s+/g, ' ').trim()
        if (!name || name.length < 2 || name.length > 10) return
        seen.add(id)
        // 부모 요소에서 팀/포지션 찾기
        const parent = $(el).closest('tr, li, div.item, div.player')
        const parentText = parent.text()
        const kboTeams = ['KIA', '삼성', 'LG', 'NC', '두산', 'SSG', '롯데', '키움', 'KT', '한화']
        const team = kboTeams.find(t => parentText.includes(t)) || ''
        results.push({ id, name, team, position: '', type: 'batter' })
      })
      console.log('[search] fallback results:', results.length)
    }

    return results.slice(0, 20)
  } catch (e) {
    console.error('[search] error:', e)
    return []
  }
}

async function scrapeStatMap(url: string): Promise<{ name: string; team: string; position: string; statMap: Record<string, string> }> {
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
  const html = await res.text()
  const { load } = await import('cheerio')
  const $ = load(html)

  // statiz 선수 기본 정보 파싱
  // 선수 이름: .player_name, h1.name, .name_wrap h1 등 여러 패턴 시도
  let name = ''
  let team = ''
  let position = ''

  // 이름 파싱 시도 (다양한 선택자)
  const nameSelectors = ['.name_wrap .name', '.player_name', 'h1.name', '.name', 'h2.name']
  for (const sel of nameSelectors) {
    const txt = $(sel).first().text().trim()
    if (txt && txt.length >= 2 && txt.length <= 10) { name = txt; break }
  }

  // 팀/포지션 파싱 시도
  const infoSelectors = ['.player_info', '.info_wrap', '.profile_info']
  for (const sel of infoSelectors) {
    const el = $(sel).first()
    if (el.length) {
      const spans = el.find('span, em, li')
      spans.each((_, span) => {
        const txt = $(span).text().trim()
        const kboTeams = ['KIA', '삼성', 'LG', 'NC', '두산', 'SSG', '롯데', '키움', 'KT', '한화']
        if (kboTeams.some(t => txt.includes(t))) team = txt
        if (['투수', '포수', '내야수', '외야수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수'].some(p => txt.includes(p))) position = txt
      })
      break
    }
  }

  const statMap: Record<string, string> = {}

  // 테이블 전체 파싱 (statiz는 주로 테이블 형태)
  $('table').each((_, table) => {
    const headers: string[] = []
    $(table).find('thead th, thead td').each((_, th) => { headers.push($(th).text().trim()) })

    if (headers.length > 0) {
      $(table).find('tbody tr').each((_, row) => {
        const cells = $(row).find('td')
        cells.each((i, td) => {
          if (headers[i]) statMap[headers[i]] = $(td).text().trim()
        })
      })
    }
  })

  // dl/dt/dd 형태 파싱
  $('dl').each((_, dl) => {
    const labels: string[] = []
    const values: string[] = []
    $(dl).find('dt').each((_, dt) => { labels.push($(dt).text().trim()) })
    $(dl).find('dd').each((_, dd) => { values.push($(dd).text().trim()) })
    labels.forEach((l, i) => { if (l && values[i]) statMap[l] = values[i] })
  })

  // li 형태 파싱
  $('li').each((_, li) => {
    const label = $(li).find('[class*="label"], [class*="title"], span:first-child').text().trim()
    const value = $(li).find('[class*="value"], [class*="num"], strong').text().trim()
    if (label && value) statMap[label] = value
  })

  // 이름을 제목 태그에서 추출 시도
  if (!name) {
    $('title').each((_, el) => {
      const txt = $(el).text().trim()
      // "이정후 - 스태티즈" 형태
      const match = txt.match(/^([가-힣]{2,5})/)
      if (match) name = match[1]
    })
  }

  return { name, team, position, statMap }
}

export async function getBatterStats(playerId: string, year = new Date().getFullYear()): Promise<BatterStats | null> {
  try {
    const url = `${STATIZ_BASE}/player/?m=detail&p_no=${playerId}&year=${year}&type=bat`
    const { name, team, position, statMap } = await scrapeStatMap(url)
    if (!name && Object.keys(statMap).length === 0) return null

    const avg = safeFloat(statMap['AVG'] || statMap['타율'])
    const slg = safeFloat(statMap['SLG'] || statMap['장타율'])
    const obp = safeFloat(statMap['OBP'] || statMap['출루율'])

    return {
      name: name || `선수 #${playerId}`, team: team || '-', position: position || '-',
      games: safeInt(statMap['G'] || statMap['경기']),
      pa: safeInt(statMap['PA'] || statMap['타석']),
      ab: safeInt(statMap['AB'] || statMap['타수']),
      avg, obp, slg,
      ops: safeFloat(statMap['OPS']) || (obp + slg),
      hits: safeInt(statMap['H'] || statMap['안타']),
      doubles: safeInt(statMap['2B'] || statMap['2루타']),
      triples: safeInt(statMap['3B'] || statMap['3루타']),
      hr: safeInt(statMap['HR'] || statMap['홈런']),
      rbi: safeInt(statMap['RBI'] || statMap['타점']),
      runs: safeInt(statMap['R'] || statMap['득점']),
      sb: safeInt(statMap['SB'] || statMap['도루']),
      cs: safeInt(statMap['CS'] || statMap['도실']),
      bb: safeInt(statMap['BB'] || statMap['볼넷']),
      hbp: safeInt(statMap['HBP'] || statMap['사구']),
      so: safeInt(statMap['SO'] || statMap['K'] || statMap['삼진']),
      gdp: safeInt(statMap['GDP'] || statMap['병살']),
      woba: safeFloat(statMap['wOBA']),
      wrcPlus: safeFloat(statMap['wRC+'] || statMap['wRC플러스']),
      war: safeFloat(statMap['WAR'] || statMap['rWAR']),
      babip: safeFloat(statMap['BABIP']),
      iso: safeFloat(statMap['ISO']) || (slg - avg),
      bbPct: safeFloat(statMap['BB%'] || statMap['BB/PA']),
      kPct: safeFloat(statMap['K%'] || statMap['SO%']),
      spd: safeFloat(statMap['Spd'] || statMap['SPD']),
      bsr: safeFloat(statMap['BsR'] || statMap['BSR']),
      uzr: safeFloat(statMap['UZR']),
      wraa: safeFloat(statMap['wRAA']),
    }
  } catch (e) {
    console.error('Batter stats error:', e)
    return null
  }
}

export async function getPitcherStats(playerId: string, year = new Date().getFullYear()): Promise<PitcherStats | null> {
  try {
    const url = `${STATIZ_BASE}/player/?m=detail&p_no=${playerId}&year=${year}&type=pit`
    const { name, team, position, statMap } = await scrapeStatMap(url)
    if (!name && Object.keys(statMap).length === 0) return null

    const kPer9 = safeFloat(statMap['K/9'])
    const bbPer9 = safeFloat(statMap['BB/9'])

    return {
      name: name || `선수 #${playerId}`, team: team || '-', role: position || '-',
      games: safeInt(statMap['G'] || statMap['경기']),
      wins: safeInt(statMap['W'] || statMap['승']),
      losses: safeInt(statMap['L'] || statMap['패']),
      saves: safeInt(statMap['SV'] || statMap['세']),
      holds: safeInt(statMap['HLD'] || statMap['홀드']),
      ip: safeFloat(statMap['IP'] || statMap['이닝']),
      era: safeFloat(statMap['ERA'] || statMap['방어율']),
      whip: safeFloat(statMap['WHIP']),
      so: safeInt(statMap['SO'] || statMap['K'] || statMap['탈삼진']),
      bb: safeInt(statMap['BB'] || statMap['볼넷']),
      hits: safeInt(statMap['H'] || statMap['피안타']),
      hr: safeInt(statMap['HR'] || statMap['피홈런']),
      er: safeInt(statMap['ER'] || statMap['자책']),
      fip: safeFloat(statMap['FIP']),
      xfip: safeFloat(statMap['xFIP']),
      war: safeFloat(statMap['WAR'] || statMap['rWAR']),
      babip: safeFloat(statMap['BABIP'] || statMap['피BABIP']),
      lobPct: safeFloat(statMap['LOB%'] || statMap['잔루율']),
      kPer9, bbPer9,
      hrPer9: safeFloat(statMap['HR/9']),
      kBb: safeFloat(statMap['K/BB']) || (bbPer9 > 0 ? kPer9 / bbPer9 : 0),
      kPct: safeFloat(statMap['K%']),
      bbPct: safeFloat(statMap['BB%']),
      gbPct: safeFloat(statMap['GB%'] || statMap['땅볼%']),
      fbPct: safeFloat(statMap['FB%'] || statMap['뜬공%']),
      siera: safeFloat(statMap['SIERA']),
    }
  } catch (e) {
    console.error('Pitcher stats error:', e)
    return null
  }
}
