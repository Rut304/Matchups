/**
 * X/Twitter API Scraper for Expert Picks
 * 
 * Uses X API v2 to fetch tweets from sports betting experts
 * Parses tweets to extract picks and stores them in the database
 * 
 * Required env vars:
 * - X_API_KEY (API Key)
 * - X_API_SECRET (API Key Secret)
 * - X_ACCESS_TOKEN (Access Token)
 * - X_ACCESS_TOKEN_SECRET (Access Token Secret)
 * - X_BEARER_TOKEN (Bearer Token - for app-only auth)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for X API responses
interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    urls?: Array<{
      expanded_url: string;
      display_url: string;
    }>;
    hashtags?: Array<{
      tag: string;
    }>;
  };
}

interface TweetResponse {
  data?: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    newest_id?: string;
    oldest_id?: string;
    result_count: number;
    next_token?: string;
  };
}

interface ParsedPick {
  team?: string;
  opponent?: string;
  sport?: string;
  pickType?: 'spread' | 'moneyline' | 'total' | 'straight_up';
  spread?: number;
  total?: number;
  side?: 'home' | 'away' | 'over' | 'under';
  confidence?: 'lock' | 'lean' | 'standard';
  rawText: string;
}

// Team name mappings for parsing
const NFL_TEAMS: Record<string, string[]> = {
  'Arizona Cardinals': ['Cardinals', 'Arizona', 'ARI', 'Cards'],
  'Atlanta Falcons': ['Falcons', 'Atlanta', 'ATL'],
  'Baltimore Ravens': ['Ravens', 'Baltimore', 'BAL'],
  'Buffalo Bills': ['Bills', 'Buffalo', 'BUF'],
  'Carolina Panthers': ['Panthers', 'Carolina', 'CAR'],
  'Chicago Bears': ['Bears', 'Chicago', 'CHI'],
  'Cincinnati Bengals': ['Bengals', 'Cincinnati', 'CIN', 'Cincy'],
  'Cleveland Browns': ['Browns', 'Cleveland', 'CLE'],
  'Dallas Cowboys': ['Cowboys', 'Dallas', 'DAL'],
  'Denver Broncos': ['Broncos', 'Denver', 'DEN'],
  'Detroit Lions': ['Lions', 'Detroit', 'DET'],
  'Green Bay Packers': ['Packers', 'Green Bay', 'GB'],
  'Houston Texans': ['Texans', 'Houston', 'HOU'],
  'Indianapolis Colts': ['Colts', 'Indianapolis', 'Indy', 'IND'],
  'Jacksonville Jaguars': ['Jaguars', 'Jacksonville', 'Jax', 'JAX'],
  'Kansas City Chiefs': ['Chiefs', 'Kansas City', 'KC'],
  'Las Vegas Raiders': ['Raiders', 'Las Vegas', 'Vegas', 'LV', 'LVR'],
  'Los Angeles Chargers': ['Chargers', 'LA Chargers', 'LAC'],
  'Los Angeles Rams': ['Rams', 'LA Rams', 'LAR'],
  'Miami Dolphins': ['Dolphins', 'Miami', 'MIA'],
  'Minnesota Vikings': ['Vikings', 'Minnesota', 'MIN'],
  'New England Patriots': ['Patriots', 'New England', 'NE', 'Pats'],
  'New Orleans Saints': ['Saints', 'New Orleans', 'NO', 'NOLA'],
  'New York Giants': ['Giants', 'NY Giants', 'NYG'],
  'New York Jets': ['Jets', 'NY Jets', 'NYJ'],
  'Philadelphia Eagles': ['Eagles', 'Philadelphia', 'Philly', 'PHI'],
  'Pittsburgh Steelers': ['Steelers', 'Pittsburgh', 'PIT'],
  'San Francisco 49ers': ['49ers', 'San Francisco', 'SF', 'Niners'],
  'Seattle Seahawks': ['Seahawks', 'Seattle', 'SEA'],
  'Tampa Bay Buccaneers': ['Buccaneers', 'Tampa Bay', 'Tampa', 'TB', 'Bucs'],
  'Tennessee Titans': ['Titans', 'Tennessee', 'TEN'],
  'Washington Commanders': ['Commanders', 'Washington', 'WAS', 'WSH'],
};

const NBA_TEAMS: Record<string, string[]> = {
  'Atlanta Hawks': ['Hawks', 'Atlanta', 'ATL'],
  'Boston Celtics': ['Celtics', 'Boston', 'BOS'],
  'Brooklyn Nets': ['Nets', 'Brooklyn', 'BKN'],
  'Charlotte Hornets': ['Hornets', 'Charlotte', 'CHA'],
  'Chicago Bulls': ['Bulls', 'Chicago', 'CHI'],
  'Cleveland Cavaliers': ['Cavaliers', 'Cleveland', 'CLE', 'Cavs'],
  'Dallas Mavericks': ['Mavericks', 'Dallas', 'DAL', 'Mavs'],
  'Denver Nuggets': ['Nuggets', 'Denver', 'DEN'],
  'Detroit Pistons': ['Pistons', 'Detroit', 'DET'],
  'Golden State Warriors': ['Warriors', 'Golden State', 'GSW', 'Dubs'],
  'Houston Rockets': ['Rockets', 'Houston', 'HOU'],
  'Indiana Pacers': ['Pacers', 'Indiana', 'IND'],
  'LA Clippers': ['Clippers', 'LA Clippers', 'LAC'],
  'Los Angeles Lakers': ['Lakers', 'LA Lakers', 'LAL'],
  'Memphis Grizzlies': ['Grizzlies', 'Memphis', 'MEM', 'Grizz'],
  'Miami Heat': ['Heat', 'Miami', 'MIA'],
  'Milwaukee Bucks': ['Bucks', 'Milwaukee', 'MIL'],
  'Minnesota Timberwolves': ['Timberwolves', 'Minnesota', 'MIN', 'Wolves'],
  'New Orleans Pelicans': ['Pelicans', 'New Orleans', 'NOP', 'NOLA'],
  'New York Knicks': ['Knicks', 'New York', 'NYK'],
  'Oklahoma City Thunder': ['Thunder', 'Oklahoma City', 'OKC'],
  'Orlando Magic': ['Magic', 'Orlando', 'ORL'],
  'Philadelphia 76ers': ['76ers', 'Philadelphia', 'PHI', 'Sixers'],
  'Phoenix Suns': ['Suns', 'Phoenix', 'PHX'],
  'Portland Trail Blazers': ['Trail Blazers', 'Portland', 'POR', 'Blazers'],
  'Sacramento Kings': ['Kings', 'Sacramento', 'SAC'],
  'San Antonio Spurs': ['Spurs', 'San Antonio', 'SAS'],
  'Toronto Raptors': ['Raptors', 'Toronto', 'TOR'],
  'Utah Jazz': ['Jazz', 'Utah', 'UTA'],
  'Washington Wizards': ['Wizards', 'Washington', 'WAS'],
};

// Combine all teams for matching
const ALL_TEAMS = { ...NFL_TEAMS, ...NBA_TEAMS };

export class XScraper {
  private bearerToken: string;
  private supabase: SupabaseClient;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    // Support both naming conventions
    const bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN or TWITTER_BEARER_TOKEN environment variable is required');
    }
    this.bearerToken = bearerToken;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Make authenticated request to X API
   */
  private async fetchX(endpoint: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error(`X API 401 Unauthorized - Bearer token may be invalid, expired, or lacks permissions. ` +
          `Please verify your token at https://developer.x.com/en/portal/projects-and-apps`);
      } else if (response.status === 403) {
        throw new Error(`X API 403 Forbidden - Your X Developer account may not have access to this endpoint. ` +
          `Check your app permissions and access level.`);
      } else if (response.status === 429) {
        throw new Error(`X API 429 Rate Limited - Too many requests. Please wait before retrying.`);
      }
      
      throw new Error(`X API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Get user ID from username
   */
  async getUserId(username: string): Promise<string | null> {
    try {
      const data = await this.fetchX(`/users/by/username/${username}`);
      return data?.data?.id || null;
    } catch (error) {
      console.error(`Failed to get user ID for @${username}:`, error);
      return null;
    }
  }

  /**
   * Fetch recent tweets from a user
   */
  async getUserTweets(
    userId: string, 
    options: {
      sinceId?: string;
      maxResults?: number;
    } = {}
  ): Promise<TweetResponse> {
    const params: Record<string, string> = {
      'tweet.fields': 'created_at,public_metrics,entities',
      'max_results': String(options.maxResults || 100),
      'exclude': 'retweets,replies', // Only get original tweets
    };

    if (options.sinceId) {
      params['since_id'] = options.sinceId;
    }

    return this.fetchX(`/users/${userId}/tweets`, params);
  }

  /**
   * Search for tweets containing picks-related keywords
   */
  async searchTweets(query: string, options: { maxResults?: number } = {}): Promise<TweetResponse> {
    const params: Record<string, string> = {
      'query': query,
      'tweet.fields': 'created_at,public_metrics,entities,author_id',
      'expansions': 'author_id',
      'user.fields': 'username,name,profile_image_url',
      'max_results': String(options.maxResults || 100),
    };

    return this.fetchX('/tweets/search/recent', params);
  }

  /**
   * Parse a tweet to extract potential pick information
   */
  parseTweetForPick(text: string): ParsedPick | null {
    const lowerText = text.toLowerCase();
    
    // Skip retweets and quotes
    if (lowerText.startsWith('rt @') || lowerText.includes('via @')) {
      return null;
    }

    // Look for betting keywords
    const bettingKeywords = [
      'pick', 'bet', 'lock', 'play', 'take', 'hammer', 'love',
      'spread', 'over', 'under', 'ml', 'moneyline', 'ats',
      '-3', '-7', '+3', '+7', '-110', '+110', // Common spreads
      'units', 'unit', '🔒', '💰', '🎯', '✅'
    ];

    const hasBettingContext = bettingKeywords.some(kw => lowerText.includes(kw));
    if (!hasBettingContext) {
      return null;
    }

    // Find team mentions
    let foundTeam: string | null = null;
    let foundOpponent: string | null = null;
    let sport: string | null = null;

    for (const [fullName, aliases] of Object.entries(ALL_TEAMS)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(text)) {
          if (!foundTeam) {
            foundTeam = fullName;
            sport = NFL_TEAMS[fullName] ? 'NFL' : 'NBA';
          } else if (!foundOpponent && fullName !== foundTeam) {
            foundOpponent = fullName;
          }
        }
      }
    }

    if (!foundTeam) {
      return null;
    }

    // Determine pick type
    let pickType: 'spread' | 'moneyline' | 'total' | 'straight_up' = 'straight_up';
    let spread: number | undefined;
    let total: number | undefined;
    let side: 'home' | 'away' | 'over' | 'under' | undefined;

    // Look for spread (e.g., -3.5, +7)
    const spreadMatch = text.match(/([+-]\d+\.?\d?)\s*(pts?|points?)?/i);
    if (spreadMatch) {
      spread = parseFloat(spreadMatch[1]);
      pickType = 'spread';
    }

    // Look for total (e.g., O 48.5, U 210)
    const totalMatch = text.match(/\b(o|u|over|under)\s*(\d+\.?\d?)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[2]);
      side = totalMatch[1].toLowerCase().startsWith('o') ? 'over' : 'under';
      pickType = 'total';
    }

    // Determine confidence
    let confidence: 'lock' | 'lean' | 'standard' = 'standard';
    if (lowerText.includes('lock') || lowerText.includes('🔒') || lowerText.includes('hammer')) {
      confidence = 'lock';
    } else if (lowerText.includes('lean') || lowerText.includes('like')) {
      confidence = 'lean';
    }

    return {
      team: foundTeam,
      opponent: foundOpponent || undefined,
      sport: sport || undefined,
      pickType,
      spread,
      total,
      side,
      confidence,
      rawText: text,
    };
  }

  /**
   * Scrape tweets from all tracked experts
   */
  async scrapeAllExperts(): Promise<{
    processed: number;
    picks: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      picks: 0,
      errors: [] as string[],
    };

    // Get all experts with Twitter handles
    const { data: experts, error } = await this.supabase
      .from('expert_records')
      .select('*')
      .not('twitter_handle', 'is', null);

    if (error || !experts) {
      results.errors.push(`Failed to fetch experts: ${error?.message}`);
      return results;
    }

    // Dedupe by twitter handle (some experts track multiple sports)
    const uniqueHandles = new Map<string, typeof experts[0]>();
    for (const expert of experts) {
      if (expert.twitter_handle && !uniqueHandles.has(expert.twitter_handle)) {
        uniqueHandles.set(expert.twitter_handle, expert);
      }
    }

    console.log(`Scraping ${uniqueHandles.size} unique Twitter handles...`);

    for (const [handle, expert] of uniqueHandles) {
      try {
        await this.scrapeExpert(handle, expert.twitter_last_tweet_id);
        results.processed++;
        
        // Rate limit: wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const msg = `Error scraping @${handle}: ${error instanceof Error ? error.message : error}`;
        console.error(msg);
        results.errors.push(msg);
      }
    }

    return results;
  }

  /**
   * Scrape tweets from a specific expert
   */
  async scrapeExpert(handle: string, sinceId?: string): Promise<{
    tweets: number;
    picks: number;
  }> {
    console.log(`Scraping @${handle}...`);

    // Get user ID if we don't have it
    const userId = await this.getUserId(handle);
    if (!userId) {
      throw new Error(`Could not find user ID for @${handle}`);
    }

    // Fetch tweets
    const response = await this.getUserTweets(userId, {
      sinceId: sinceId || undefined,
      maxResults: 50,
    });

    if (!response.data || response.data.length === 0) {
      console.log(`No new tweets from @${handle}`);
      return { tweets: 0, picks: 0 };
    }

    let picksFound = 0;

    // Process each tweet
    for (const tweet of response.data) {
      // Check if we already have this tweet
      const { data: existing } = await this.supabase
        .from('expert_tweets')
        .select('id')
        .eq('tweet_id', tweet.id)
        .single();

      if (existing) {
        continue;
      }

      // Parse for picks
      const parsedPick = this.parseTweetForPick(tweet.text);

      // Store the tweet
      await this.supabase.from('expert_tweets').insert({
        tweet_id: tweet.id,
        twitter_handle: handle,
        twitter_user_id: userId,
        tweet_text: tweet.text,
        tweet_url: `https://x.com/${handle}/status/${tweet.id}`,
        created_at_twitter: tweet.created_at,
        like_count: tweet.public_metrics?.like_count || 0,
        retweet_count: tweet.public_metrics?.retweet_count || 0,
        reply_count: tweet.public_metrics?.reply_count || 0,
        parsed_pick: parsedPick ? JSON.stringify(parsedPick) : null,
        is_pick: !!parsedPick,
        pick_confidence: parsedPick ? 0.7 : null, // Default confidence
        processed: false,
      });

      if (parsedPick) {
        picksFound++;
        console.log(`  Found pick: ${parsedPick.team} (${parsedPick.pickType})`);
      }
    }

    // Update expert's last tweet ID
    if (response.meta?.newest_id) {
      await this.supabase
        .from('expert_records')
        .update({
          twitter_user_id: userId,
          twitter_last_scraped: new Date().toISOString(),
          twitter_last_tweet_id: response.meta.newest_id,
        })
        .eq('twitter_handle', handle);
    }

    console.log(`  Processed ${response.data.length} tweets, found ${picksFound} picks`);
    return { tweets: response.data.length, picks: picksFound };
  }

  /**
   * Get unprocessed tweets that contain picks
   */
  async getUnprocessedPicks(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('expert_tweets')
      .select('*')
      .eq('is_pick', true)
      .eq('processed', false)
      .order('created_at_twitter', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Convert a parsed tweet pick to an expert_picks record
   */
  async convertTweetToPick(
    tweet: any,
    gameInfo: {
      gameId: string;
      homeTeam: string;
      awayTeam: string;
      gameDate: string;
    }
  ): Promise<void> {
    const parsedPick = typeof tweet.parsed_pick === 'string' 
      ? JSON.parse(tweet.parsed_pick) 
      : tweet.parsed_pick;

    if (!parsedPick) return;

    // Get expert info
    const { data: expert } = await this.supabase
      .from('expert_records')
      .select('*')
      .eq('twitter_handle', tweet.twitter_handle)
      .single();

    if (!expert) return;

    // Determine pick side
    const pickSide = parsedPick.team === gameInfo.homeTeam ? 'home' : 'away';

    // Insert the pick
    const { data: pick, error } = await this.supabase
      .from('expert_picks')
      .insert({
        expert_name: expert.name,
        source: 'twitter',
        sport: parsedPick.sport || expert.sport,
        game_id: gameInfo.gameId,
        home_team: gameInfo.homeTeam,
        away_team: gameInfo.awayTeam,
        game_date: gameInfo.gameDate,
        pick: parsedPick.team,
        pick_type: parsedPick.pickType || 'straight_up',
        pick_side: parsedPick.side || pickSide,
        spread: parsedPick.spread,
        total: parsedPick.total,
        confidence: parsedPick.confidence || 'standard',
        is_lock: parsedPick.confidence === 'lock',
        source_url: tweet.tweet_url,
        quote: tweet.tweet_text,
        result: 'pending',
      })
      .select()
      .single();

    if (!error && pick) {
      // Link tweet to pick
      await this.supabase
        .from('expert_tweets')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          expert_pick_id: pick.id,
        })
        .eq('id', tweet.id);
    }
  }
}

// Singleton export
let scraperInstance: XScraper | null = null;

export function getXScraper(): XScraper {
  if (!scraperInstance) {
    scraperInstance = new XScraper();
  }
  return scraperInstance;
}

// CLI runner
if (require.main === module) {
  const scraper = new XScraper();
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  async function run() {
    switch (command) {
      case 'scrape-all':
        console.log('Scraping all experts...');
        const results = await scraper.scrapeAllExperts();
        console.log('Results:', results);
        break;
        
      case 'scrape':
        if (!arg) {
          console.error('Usage: npx tsx x-scraper.ts scrape <handle>');
          process.exit(1);
        }
        console.log(`Scraping @${arg}...`);
        const result = await scraper.scrapeExpert(arg);
        console.log('Result:', result);
        break;
        
      case 'search':
        if (!arg) {
          console.error('Usage: npx tsx x-scraper.ts search "<query>"');
          process.exit(1);
        }
        console.log(`Searching: ${arg}`);
        const tweets = await scraper.searchTweets(arg);
        console.log('Found:', tweets.meta?.result_count, 'tweets');
        tweets.data?.forEach(t => console.log(`- ${t.text.substring(0, 100)}...`));
        break;
        
      default:
        console.log('Usage:');
        console.log('  npx tsx x-scraper.ts scrape-all     - Scrape all tracked experts');
        console.log('  npx tsx x-scraper.ts scrape <handle> - Scrape specific user');
        console.log('  npx tsx x-scraper.ts search "<query>" - Search tweets');
    }
  }
  
  run().catch(console.error);
}
