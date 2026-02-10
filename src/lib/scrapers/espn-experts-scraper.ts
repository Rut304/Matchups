/**
 * ESPN Expert Picks Scraper
 * Scrapes REAL expert picks with tracked records from ESPN
 * 
 * ESPN tracks these experts with verified W/L records:
 * - NFL, NBA, NCAAF, NCAAB picks
 * - Historical season records
 * - Per-game picks with outcomes
 */

export interface ESPNExpert {
  id: string;
  name: string;
  fullName: string;
  headshot: string;
  weekRecord: string;
  overallRecord: string;
  winPct: number;
  wins: number;
  losses: number;
  network: string;
}

export interface ESPNGamePick {
  gameId: string;
  teams: string;
  date: string;
  expertId: string;
  pickedTeam: string;
  pickedTeamLogo: string;
  isWinner: boolean | null;
}

export interface ESPNPicksData {
  title: string;
  sport: string;
  week: string;
  experts: ESPNExpert[];
  picks: ESPNGamePick[];
  scrapedAt: string;
}

const SPORT_URLS: Record<string, string> = {
  nfl: 'https://www.espn.com/nfl/picks',
  nba: 'https://www.espn.com/nba/picks',
  ncaaf: 'https://www.espn.com/college-football/picks',
  ncaab: 'https://www.espn.com/mens-college-basketball/picks',
};

function parseRecord(record: string): { wins: number; losses: number; winPct: number } {
  const [wins, losses] = record.split('-').map(Number);
  const total = wins + losses;
  const winPct = total > 0 ? (wins / total) * 100 : 0;
  return { wins, losses, winPct };
}

export async function scrapeESPNExperts(sport: string = 'nfl'): Promise<ESPNPicksData | null> {
  const url = SPORT_URLS[sport.toLowerCase()];
  if (!url) {
    console.error(`Unknown sport: ${sport}`);
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`ESPN returned ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract the __espnfitt__ JSON data
    const dataMatch = html.match(/window\['__espnfitt__'\]\s*=\s*({[\s\S]*?});\s*<\/script>/);
    if (!dataMatch) {
      console.error('Could not find ESPN data in page');
      return null;
    }

    let data;
    try {
      data = JSON.parse(dataMatch[1]);
    } catch (e) {
      console.error('Failed to parse ESPN JSON:', e);
      return null;
    }

    const picksData = data?.page?.content?.picksData;
    if (!picksData) {
      console.error('No picksData found in ESPN response');
      return null;
    }

    // Parse experts from header
    const experts: ESPNExpert[] = [];
    const header = picksData.header || [];
    
    for (const item of header) {
      if (typeof item === 'object' && item.name && item.id) {
        const { wins, losses, winPct } = parseRecord(item.overall || '0-0');
        experts.push({
          id: String(item.id),
          name: item.name,
          fullName: item.headshot?.alt || item.name,
          headshot: item.headshot?.href || '',
          weekRecord: item.weekRecord || '0-0',
          overallRecord: item.overall || '0-0',
          winPct: Math.round(winPct * 10) / 10,
          wins,
          losses,
          network: 'ESPN',
        });
      }
    }

    // Parse picks from rows
    const picks: ESPNGamePick[] = [];
    const rows = picksData.rows || [];
    
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) continue;
      
      const gameInfo = row[0];
      if (!gameInfo || !gameInfo.id || !gameInfo.teams) continue;
      
      // Skip the record summary row
      if (gameInfo.week === 'This Week') continue;
      
      // Each subsequent item in the row is an expert's pick
      for (let i = 1; i < row.length; i++) {
        const pick = row[i];
        if (!pick || !pick.id) continue;
        
        const expert = experts.find(e => e.id === String(pick.id));
        if (!expert) continue;
        
        picks.push({
          gameId: gameInfo.id,
          teams: gameInfo.teams,
          date: gameInfo.date || '',
          expertId: expert.id,
          pickedTeam: pick.logo ? pick.logo.split('/').pop()?.replace('.png', '').toUpperCase() || '' : '',
          pickedTeamLogo: pick.logo || '',
          isWinner: pick.winner ?? null,
        });
      }
    }

    return {
      title: picksData.title || `${sport.toUpperCase()} Expert Picks`,
      sport: sport.toUpperCase(),
      week: data?.page?.content?.currents?.week || '',
      experts: experts.sort((a, b) => b.winPct - a.winPct), // Sort by win %
      picks,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error scraping ESPN:', error);
    return null;
  }
}

// Scrape all sports
export async function scrapeAllESPNExperts(): Promise<Record<string, ESPNPicksData | null>> {
  const results: Record<string, ESPNPicksData | null> = {};
  
  for (const sport of Object.keys(SPORT_URLS)) {
    results[sport] = await scrapeESPNExperts(sport);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Get combined expert leaderboard across all sports
export async function getESPNExpertLeaderboard(): Promise<ESPNExpert[]> {
  const allData = await scrapeAllESPNExperts();
  const expertMap = new Map<string, ESPNExpert>();
  
  for (const [sport, data] of Object.entries(allData)) {
    if (!data) continue;
    
    for (const expert of data.experts) {
      const existing = expertMap.get(expert.fullName);
      if (existing) {
        // Combine records
        existing.wins += expert.wins;
        existing.losses += expert.losses;
        const total = existing.wins + existing.losses;
        existing.winPct = total > 0 ? Math.round((existing.wins / total) * 1000) / 10 : 0;
        existing.overallRecord = `${existing.wins}-${existing.losses}`;
      } else {
        expertMap.set(expert.fullName, { ...expert });
      }
    }
  }
  
  return Array.from(expertMap.values()).sort((a, b) => b.winPct - a.winPct);
}
