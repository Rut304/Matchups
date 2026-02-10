/**
 * COMPREHENSIVE BETTING EXPERTS DATABASE
 * 
 * Every known sports betting expert, pundit, and personality across:
 * - TV Networks (ESPN, FOX, CBS, TNT, NBC, NFL Network)
 * - Radio (ESPN Radio, Sirius XM, local sports radio)
 * - Podcasts (major betting/sports pods)
 * - Social Media (big name bettors on X/Twitter)
 * - Sharps & Professional Bettors
 * 
 * Each expert has:
 * - X/Twitter handle for real-time pick scraping
 * - Network affiliation for cross-referencing picks
 * - Known shows/platforms
 * - Sport specialties
 */

export interface BettingExpert {
  id: string
  name: string
  xHandle: string | null  // Twitter/X handle (without @)
  network: string
  shows: string[]
  sports: string[]
  type: 'tv' | 'radio' | 'podcast' | 'sharp' | 'social' | 'writer'
  espnId?: string  // ESPN expert ID if available
  priority: number  // 1-5, higher = more important to track
  notes?: string
}

export const BETTING_EXPERTS: BettingExpert[] = [
  // ============================================
  // ESPN - TV & WEBSITE PERSONALITIES
  // ============================================
  {
    id: 'stephen-a-smith',
    name: 'Stephen A. Smith',
    xHandle: 'stephenasmith',
    network: 'ESPN',
    shows: ['First Take', 'NBA Countdown'],
    sports: ['NBA', 'NFL'],
    type: 'tv',
    priority: 5,
    notes: 'Very public with picks on First Take'
  },
  {
    id: 'pat-mcafee',
    name: 'Pat McAfee',
    xHandle: 'PatMcAfeeShow',
    network: 'ESPN',
    shows: ['The Pat McAfee Show'],
    sports: ['NFL', 'CFB'],
    type: 'tv',
    priority: 5,
    notes: 'Daily picks on show, massive audience'
  },
  {
    id: 'pablo-torre',
    name: 'Pablo Torre',
    xHandle: 'PabsLoyal',
    network: 'ESPN',
    shows: ['Pablo Torre Finds Out'],
    sports: ['NBA', 'NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'mike-greenberg',
    name: 'Mike Greenberg',
    xHandle: 'Espngreeny',
    network: 'ESPN',
    shows: ['Get Up'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'dan-orlovsky',
    name: 'Dan Orlovsky',
    xHandle: 'dlorlovsky7',
    network: 'ESPN',
    shows: ['First Take', 'Get Up', 'NFL Live'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4,
    notes: 'Makes NFL predictions frequently'
  },
  {
    id: 'mina-kimes',
    name: 'Mina Kimes',
    xHandle: 'minakimes',
    network: 'ESPN',
    shows: ['NFL Live', 'Around the Horn'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'marcus-spears',
    name: 'Marcus Spears',
    xHandle: 'maborosbeef',
    network: 'ESPN',
    shows: ['NFL Live', 'First Take'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'ryan-clark',
    name: 'Ryan Clark',
    xHandle: 'Realrclark25',
    network: 'ESPN',
    shows: ['Get Up', 'NFL Live'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'molly-qerim',
    name: 'Molly Qerim',
    xHandle: 'MollyQerim',
    network: 'ESPN',
    shows: ['First Take'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 2
  },
  {
    id: 'kendrick-perkins',
    name: 'Kendrick Perkins',
    xHandle: 'KendrickPerkins',
    network: 'ESPN',
    shows: ['Get Up', 'First Take', 'NBA Today'],
    sports: ['NBA'],
    type: 'tv',
    priority: 4,
    notes: 'Notorious for bad takes - great fade candidate'
  },
  {
    id: 'jj-redick',
    name: 'JJ Redick',
    xHandle: 'jaborosredick',
    network: 'ESPN',
    shows: ['First Take', 'NBA Countdown'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3,
    notes: 'Now Lakers coach, previously made picks on ESPN'
  },
  {
    id: 'richard-jefferson',
    name: 'Richard Jefferson',
    xHandle: 'Rjeff24',
    network: 'ESPN',
    shows: ['NBA Countdown', 'The Jump'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'tim-legler',
    name: 'Tim Legler',
    xHandle: 'timlegler',
    network: 'ESPN',
    shows: ['SportsCenter', 'NBA Today'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'pamela-maldonado',
    name: 'Pamela Maldonado',
    xHandle: 'PamelaMaldonado',
    network: 'ESPN',
    shows: ['Daily Wager', 'ESPN.com'],
    sports: ['NFL', 'NBA', 'MLB'],
    type: 'writer',
    espnId: '2147483620',
    priority: 5,
    notes: 'Top ESPN expert picker - verified 84.6% record'
  },
  {
    id: 'eric-moody',
    name: 'Eric Moody',
    xHandle: null,
    network: 'ESPN',
    shows: ['ESPN.com'],
    sports: ['NFL'],
    type: 'writer',
    espnId: '2147483626',
    priority: 4,
    notes: 'High accuracy ESPN picker'
  },
  {
    id: 'stephania-bell',
    name: 'Stephania Bell',
    xHandle: 'Abordesbell',
    network: 'ESPN',
    shows: ['Fantasy Focus', 'NFL Live'],
    sports: ['NFL'],
    type: 'tv',
    espnId: '2147483627',
    priority: 4
  },
  {
    id: 'mike-clay',
    name: 'Mike Clay',
    xHandle: 'MikeClayNFL',
    network: 'ESPN',
    shows: ['ESPN.com'],
    sports: ['NFL'],
    type: 'writer',
    espnId: '2147483633',
    priority: 5,
    notes: 'NFL analytics expert - very accurate'
  },
  {
    id: 'matt-bowen',
    name: 'Matt Bowen',
    xHandle: 'MattBowen41',
    network: 'ESPN',
    shows: ['ESPN.com'],
    sports: ['NFL'],
    type: 'writer',
    espnId: '2329',
    priority: 4
  },
  {
    id: 'dan-graziano',
    name: 'Dan Graziano',
    xHandle: 'DanGrazianoESPN',
    network: 'ESPN',
    shows: ['Get Up', 'NFL Live'],
    sports: ['NFL'],
    type: 'tv',
    espnId: '2147483638',
    priority: 4
  },
  
  // ============================================
  // FOX SPORTS
  // ============================================
  {
    id: 'skip-bayless',
    name: 'Skip Bayless',
    xHandle: 'RealSkipBayless',
    network: 'FS1',
    shows: ['Undisputed'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 5,
    notes: 'Posts picks on X constantly - great fade'
  },
  {
    id: 'shannon-sharpe',
    name: 'Shannon Sharpe',
    xHandle: 'ShannonSharpe',
    network: 'ESPN',
    shows: ['First Take'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 5,
    notes: 'Formerly FS1, now ESPN'
  },
  {
    id: 'colin-cowherd',
    name: 'Colin Cowherd',
    xHandle: 'ColinCowherd',
    network: 'FS1',
    shows: ['The Herd'],
    sports: ['NFL', 'CFB', 'NBA'],
    type: 'tv',
    priority: 5,
    notes: 'Blazin 5 picks every week'
  },
  {
    id: 'nick-wright',
    name: 'Nick Wright',
    xHandle: 'gaborosnickwright',
    network: 'FS1',
    shows: ['First Things First', 'What\'s Wright'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'chris-broussard',
    name: 'Chris Broussard',
    xHandle: 'ChrisBroussard',
    network: 'FS1',
    shows: ['First Things First'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'joy-taylor',
    name: 'Joy Taylor',
    xHandle: 'JoyTaylorTalks',
    network: 'FS1',
    shows: ['Undisputed'],
    sports: ['NFL', 'NBA'],
    type: 'tv',
    priority: 2
  },
  {
    id: 'michael-vick',
    name: 'Michael Vick',
    xHandle: 'MikeVick',
    network: 'FS1',
    shows: ['Undisputed'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'keyshawn-johnson',
    name: 'Keyshawn Johnson',
    xHandle: 'keyaborosshawn',
    network: 'FS1/ESPN',
    shows: ['Undisputed', 'ESPN Radio'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'cris-carter',
    name: 'Cris Carter',
    xHandle: 'craboroscris80',
    network: 'FS1',
    shows: ['First Things First'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'terry-bradshaw',
    name: 'Terry Bradshaw',
    xHandle: null,
    network: 'FOX',
    shows: ['FOX NFL Sunday'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'howie-long',
    name: 'Howie Long',
    xHandle: null,
    network: 'FOX',
    shows: ['FOX NFL Sunday'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'jimmy-johnson',
    name: 'Jimmy Johnson',
    xHandle: 'JimmyJohnson',
    network: 'FOX',
    shows: ['FOX NFL Sunday'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'michael-strahan',
    name: 'Michael Strahan',
    xHandle: 'michaelstrahan',
    network: 'FOX',
    shows: ['FOX NFL Sunday', 'GMA'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  
  // ============================================
  // CBS SPORTS
  // ============================================
  {
    id: 'tony-romo',
    name: 'Tony Romo',
    xHandle: null,
    network: 'CBS',
    shows: ['NFL on CBS'],
    sports: ['NFL'],
    type: 'tv',
    priority: 5,
    notes: 'Famous for live game predictions'
  },
  {
    id: 'boomer-esiason',
    name: 'Boomer Esiason',
    xHandle: 'BoomerEsiason',
    network: 'CBS',
    shows: ['The NFL Today', 'Boomer & Gio'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'phil-simms',
    name: 'Phil Simms',
    xHandle: 'PhilSimmsQB',
    network: 'CBS',
    shows: ['The NFL Today'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'nate-burleson',
    name: 'Nate Burleson',
    xHandle: 'naborosateburleson',
    network: 'CBS',
    shows: ['The NFL Today', 'CBS Mornings'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'bill-cowher',
    name: 'Bill Cowher',
    xHandle: null,
    network: 'CBS',
    shows: ['The NFL Today'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'charles-barkley',
    name: 'Charles Barkley',
    xHandle: null,
    network: 'TNT',
    shows: ['Inside the NBA'],
    sports: ['NBA'],
    type: 'tv',
    priority: 5,
    notes: 'Infamous gambler - makes wild picks on air'
  },
  {
    id: 'shaq',
    name: 'Shaquille O\'Neal',
    xHandle: 'SHAQ',
    network: 'TNT',
    shows: ['Inside the NBA'],
    sports: ['NBA'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'kenny-smith',
    name: 'Kenny Smith',
    xHandle: 'TheJetOnTNT',
    network: 'TNT',
    shows: ['Inside the NBA'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'ernie-johnson',
    name: 'Ernie Johnson',
    xHandle: null,
    network: 'TNT',
    shows: ['Inside the NBA'],
    sports: ['NBA'],
    type: 'tv',
    priority: 2
  },
  
  // ============================================
  // NBC SPORTS
  // ============================================
  {
    id: 'chris-simms',
    name: 'Chris Simms',
    xHandle: 'CSimmsQB',
    network: 'NBC',
    shows: ['Pro Football Talk', 'Football Night in America'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4,
    notes: 'Posts picks on Peacock/NBC'
  },
  {
    id: 'mike-florio',
    name: 'Mike Florio',
    xHandle: 'ProFootballTalk',
    network: 'NBC',
    shows: ['Pro Football Talk'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'rodney-harrison',
    name: 'Rodney Harrison',
    xHandle: 'Rodney_Harrison',
    network: 'NBC',
    shows: ['Football Night in America'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'chris-collinsworth',
    name: 'Chris Collinsworth',
    xHandle: null,
    network: 'NBC',
    shows: ['Sunday Night Football'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'jason-garrett',
    name: 'Jason Garrett',
    xHandle: null,
    network: 'NBC',
    shows: ['Sunday Night Football'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  
  // ============================================
  // NFL NETWORK
  // ============================================
  {
    id: 'rich-eisen',
    name: 'Rich Eisen',
    xHandle: 'richeisen',
    network: 'NFL Network',
    shows: ['Rich Eisen Show', 'NFL GameDay'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'kyle-brandt',
    name: 'Kyle Brandt',
    xHandle: 'KyleBrandt',
    network: 'NFL Network',
    shows: ['Good Morning Football'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'peter-schrager',
    name: 'Peter Schrager',
    xHandle: 'PSchrags',
    network: 'NFL Network',
    shows: ['Good Morning Football', 'FOX NFL'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'james-palmer',
    name: 'James Palmer',
    xHandle: 'JamesPalmerTV',
    network: 'NFL Network',
    shows: ['NFL Network'],
    sports: ['NFL'],
    type: 'tv',
    priority: 2
  },
  {
    id: 'ian-rapoport',
    name: 'Ian Rapoport',
    xHandle: 'RapSheet',
    network: 'NFL Network',
    shows: ['NFL Network'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4,
    notes: 'Breaking news, not picks focused'
  },
  {
    id: 'adam-schefter',
    name: 'Adam Schefter',
    xHandle: 'AdamSchefter',
    network: 'ESPN',
    shows: ['SportsCenter', 'NFL Live'],
    sports: ['NFL'],
    type: 'tv',
    priority: 4,
    notes: 'Breaking news, not picks focused'
  },
  
  // ============================================
  // PODCASTS & INDEPENDENT MEDIA
  // ============================================
  {
    id: 'bill-simmons',
    name: 'Bill Simmons',
    xHandle: 'BillSimmons',
    network: 'The Ringer',
    shows: ['Bill Simmons Podcast', 'Guess the Lines'],
    sports: ['NFL', 'NBA'],
    type: 'podcast',
    priority: 5,
    notes: 'Million Dollar Picks - posts on X and podcast'
  },
  {
    id: 'sal-iacono',
    name: 'Cousin Sal',
    xHandle: 'TheCousinSal',
    network: 'The Ringer',
    shows: ['Guess the Lines', 'Against All Odds'],
    sports: ['NFL', 'NBA'],
    type: 'podcast',
    priority: 5,
    notes: 'Heavy gambling content - posts all picks'
  },
  {
    id: 'dave-portnoy',
    name: 'Dave Portnoy',
    xHandle: 'staborosoolpresidente',
    network: 'Barstool',
    shows: ['Barstool Sports'],
    sports: ['NFL', 'NBA', 'MLB'],
    type: 'social',
    priority: 5,
    notes: 'Live betting content - posts on X constantly'
  },
  {
    id: 'big-cat',
    name: 'Big Cat',
    xHandle: 'BarstoolBigCat',
    network: 'Barstool',
    shows: ['Pardon My Take'],
    sports: ['NFL', 'NBA', 'CFB'],
    type: 'podcast',
    priority: 5,
    notes: 'Picks of the Week segment'
  },
  {
    id: 'pft-commenter',
    name: 'PFT Commenter',
    xHandle: 'PFTCommenter',
    network: 'Barstool',
    shows: ['Pardon My Take'],
    sports: ['NFL'],
    type: 'podcast',
    priority: 4
  },
  {
    id: 'draymond-green',
    name: 'Draymond Green',
    xHandle: 'Money23Green',
    network: 'TNT/NBA',
    shows: ['The Draymond Green Show', 'Inside the NBA'],
    sports: ['NBA'],
    type: 'podcast',
    priority: 4,
    notes: 'Active player who makes picks'
  },
  {
    id: 'paul-pierce',
    name: 'Paul Pierce',
    xHandle: 'paulpierce34',
    network: 'ESPN',
    shows: ['NBA Countdown'],
    sports: ['NBA'],
    type: 'tv',
    priority: 3
  },
  {
    id: 'gilbert-arenas',
    name: 'Gilbert Arenas',
    xHandle: 'GilsArenaShow',
    network: 'Independent',
    shows: ['Gil\'s Arena'],
    sports: ['NBA'],
    type: 'podcast',
    priority: 3
  },
  
  // ============================================
  // PROFESSIONAL SHARPS & BETTING EXPERTS
  // ============================================
  {
    id: 'billy-walters',
    name: 'Billy Walters',
    xHandle: null,
    network: 'Independent',
    shows: [],
    sports: ['NFL', 'NBA', 'CFB'],
    type: 'sharp',
    priority: 5,
    notes: 'Legendary sharp - rarely public but when he is, track it'
  },
  {
    id: 'haralabos-voulgaris',
    name: 'Haralabos Voulgaris',
    xHandle: 'haabororalabob',
    network: 'Independent',
    shows: [],
    sports: ['NBA'],
    type: 'sharp',
    priority: 5,
    notes: 'NBA sharp - former Mavs analytics consultant'
  },
  {
    id: 'warren-sharp',
    name: 'Warren Sharp',
    xHandle: 'SharpFootball',
    network: 'Independent',
    shows: ['Sharp Football Analysis'],
    sports: ['NFL'],
    type: 'sharp',
    priority: 5,
    notes: 'Top NFL analytics - publishes picks'
  },
  {
    id: 'captain-jack',
    name: 'Captain Jack Andrews',
    xHandle: 'capjack2000',
    network: 'Independent',
    shows: [],
    sports: ['NFL', 'NBA'],
    type: 'sharp',
    priority: 5,
    notes: 'Professional bettor, sometimes shares picks'
  },
  {
    id: 'spanky',
    name: 'Spanky',
    xHandle: 'Spanky',
    network: 'VSiN',
    shows: ['VSiN'],
    sports: ['NFL', 'CFB'],
    type: 'sharp',
    priority: 4
  },
  {
    id: 'chad-millman',
    name: 'Chad Millman',
    xHandle: 'chadmillman',
    network: 'Action Network',
    shows: ['Action Network Podcast'],
    sports: ['NFL', 'NBA'],
    type: 'writer',
    priority: 4
  },
  {
    id: 'darren-rovell',
    name: 'Darren Rovell',
    xHandle: 'daraborosrenrovell',
    network: 'Action Network',
    shows: [],
    sports: ['All'],
    type: 'writer',
    priority: 4
  },
  {
    id: 'blackjack-fletcher',
    name: 'Blackjack Fletcher',
    xHandle: 'BlackJackOnTilt',
    network: 'Action Network',
    shows: [],
    sports: ['NFL', 'CFB'],
    type: 'sharp',
    priority: 4
  },
  {
    id: 'matt-youmans',
    name: 'Matt Youmans',
    xHandle: 'mattyoumans247',
    network: 'VSiN',
    shows: ['VSiN'],
    sports: ['NFL', 'CFB'],
    type: 'writer',
    priority: 3
  },
  {
    id: 'brent-musburger',
    name: 'Brent Musburger',
    xHandle: 'baborosrentmusburger',
    network: 'VSiN',
    shows: ['VSiN'],
    sports: ['NFL', 'CFB', 'NBA'],
    type: 'tv',
    priority: 3
  },
  
  // ============================================
  // SPORTS WRITERS / ANALYSTS
  // ============================================
  {
    id: 'jeff-passan',
    name: 'Jeff Passan',
    xHandle: 'JeffPassan',
    network: 'ESPN',
    shows: ['ESPN.com'],
    sports: ['MLB'],
    type: 'writer',
    priority: 3
  },
  {
    id: 'woj',
    name: 'Adrian Wojnarowski',
    xHandle: 'wojespn',
    network: 'ESPN',
    shows: ['ESPN'],
    sports: ['NBA'],
    type: 'writer',
    priority: 3,
    notes: 'News, not picks'
  },
  {
    id: 'shams',
    name: 'Shams Charania',
    xHandle: 'ShamsCharania',
    network: 'The Athletic',
    shows: [],
    sports: ['NBA'],
    type: 'writer',
    priority: 3,
    notes: 'News, not picks'
  },
  {
    id: 'zach-lowe',
    name: 'Zach Lowe',
    xHandle: 'ZachLowe_NBA',
    network: 'ESPN',
    shows: ['The Lowe Post'],
    sports: ['NBA'],
    type: 'writer',
    priority: 3
  },
  
  // ============================================
  // BIG NAME SOCIAL MEDIA BETTORS
  // ============================================
  {
    id: 'el-tracker',
    name: 'ElTracker',
    xHandle: 'el_tracker_',
    network: 'Independent',
    shows: [],
    sports: ['NBA', 'NFL'],
    type: 'social',
    priority: 5,
    notes: 'Pure betting account - tracks sharp money'
  },
  {
    id: 'jeff-ma',
    name: 'Jeff Ma',
    xHandle: 'JeffMa',
    network: 'Independent',
    shows: [],
    sports: ['NBA', 'MLB'],
    type: 'sharp',
    priority: 4,
    notes: 'MIT Blackjack Team member, sports bettor'
  },
  {
    id: 'gadget',
    name: 'Gadget',
    xHandle: 'GadgetBetter',
    network: 'Independent',
    shows: [],
    sports: ['NFL', 'NBA'],
    type: 'social',
    priority: 4,
    notes: 'Popular betting Twitter account'
  },
  {
    id: 'picks-central',
    name: 'Picks Central',
    xHandle: 'PicksCentral',
    network: 'Barstool',
    shows: ['Picks Central Pod'],
    sports: ['NFL', 'NBA', 'CFB'],
    type: 'podcast',
    priority: 4
  },
  {
    id: 'rj-bell',
    name: 'RJ Bell',
    xHandle: 'raborosjbell',
    network: 'Pregame',
    shows: ['RJ Bell\'s Dream Preview'],
    sports: ['NFL', 'CFB'],
    type: 'radio',
    priority: 4
  },
  {
    id: 'todd-fuhrman',
    name: 'Todd Fuhrman',
    xHandle: 'toaborosddFuhrman',
    network: 'FS1',
    shows: ['Lock It In'],
    sports: ['NFL', 'NBA', 'CFB'],
    type: 'tv',
    priority: 4
  },
  
  // ============================================
  // FORMER ATHLETES WHO GAMBLE PUBLIC
  // ============================================
  {
    id: 'pat-bev',
    name: 'Patrick Beverley',
    xHandle: 'PatBev21',
    network: 'Independent',
    shows: [],
    sports: ['NBA'],
    type: 'social',
    priority: 3,
    notes: 'Active player who tweets about betting'
  },
  {
    id: 'swaggy-p',
    name: 'Nick Young',
    xHandle: 'NickSwagyPYoung',
    network: 'Independent',
    shows: [],
    sports: ['NBA'],
    type: 'social',
    priority: 2
  },
  {
    id: 'ochocinco',
    name: 'Chad Ochocinco',
    xHandle: 'ochocinco',
    network: 'Independent',
    shows: [],
    sports: ['NFL'],
    type: 'social',
    priority: 3,
    notes: 'Often tweets gambling content'
  },
  {
    id: 'deion-sanders',
    name: 'Deion Sanders',
    xHandle: 'DeionSanders',
    network: 'NFL Network/Colorado',
    shows: ['NFL Network'],
    sports: ['NFL', 'CFB'],
    type: 'tv',
    priority: 4
  },
  {
    id: 'michael-irvin',
    name: 'Michael Irvin',
    xHandle: 'michaelirvin88',
    network: 'NFL Network',
    shows: ['NFL Network'],
    sports: ['NFL'],
    type: 'tv',
    priority: 3
  },
  
  // ============================================
  // RADIO PERSONALITIES
  // ============================================
  {
    id: 'dan-le-batard',
    name: 'Dan Le Batard',
    xHandle: 'LeBatardShow',
    network: 'Meadowlark',
    shows: ['Dan Le Batard Show'],
    sports: ['NFL', 'NBA', 'CFB'],
    type: 'radio',
    priority: 4
  },
  {
    id: 'stugotz',
    name: 'Stugotz',
    xHandle: 'stugotz790',
    network: 'Meadowlark',
    shows: ['Dan Le Batard Show', 'Stugotz Army'],
    sports: ['NFL'],
    type: 'radio',
    priority: 4,
    notes: 'Gambling Degenerate - posts all picks'
  },
  {
    id: 'carton',
    name: 'Craig Carton',
    xHandle: 'craigcarton',
    network: 'FS1',
    shows: ['The Carton Show'],
    sports: ['NFL'],
    type: 'radio',
    priority: 3
  },
  {
    id: 'joe-benigno',
    name: 'Joe Benigno',
    xHandle: null,
    network: 'WFAN',
    shows: ['WFAN'],
    sports: ['NFL'],
    type: 'radio',
    priority: 2
  },
  {
    id: 'evan-roberts',
    name: 'Evan Roberts',
    xHandle: 'EvanRoberts',
    network: 'WFAN',
    shows: ['WFAN'],
    sports: ['NFL', 'NBA'],
    type: 'radio',
    priority: 2
  },
  {
    id: 'mad-dog',
    name: 'Chris Russo',
    xHandle: null,
    network: 'Sirius XM',
    shows: ['Mad Dog Radio', 'First Take'],
    sports: ['MLB', 'NFL'],
    type: 'radio',
    priority: 3
  },
]

// Get experts by network
export function getExpertsByNetwork(network: string): BettingExpert[] {
  return BETTING_EXPERTS.filter(e => 
    e.network.toLowerCase().includes(network.toLowerCase())
  )
}

// Get experts by sport
export function getExpertsBySport(sport: string): BettingExpert[] {
  return BETTING_EXPERTS.filter(e => 
    e.sports.includes(sport.toUpperCase()) || e.sports.includes('All')
  )
}

// Get experts with X handles (for X scraping)
export function getExpertsWithXHandles(): BettingExpert[] {
  return BETTING_EXPERTS.filter(e => e.xHandle !== null)
}

// Get high-priority experts
export function getHighPriorityExperts(minPriority: number = 4): BettingExpert[] {
  return BETTING_EXPERTS.filter(e => e.priority >= minPriority)
}

// Get experts by type
export function getExpertsByType(type: BettingExpert['type']): BettingExpert[] {
  return BETTING_EXPERTS.filter(e => e.type === type)
}

// Summary stats
export const EXPERT_STATS = {
  total: BETTING_EXPERTS.length,
  withXHandle: BETTING_EXPERTS.filter(e => e.xHandle).length,
  byNetwork: {
    espn: BETTING_EXPERTS.filter(e => e.network.includes('ESPN')).length,
    fox: BETTING_EXPERTS.filter(e => e.network.includes('FOX') || e.network.includes('FS1')).length,
    cbs: BETTING_EXPERTS.filter(e => e.network.includes('CBS')).length,
    tnt: BETTING_EXPERTS.filter(e => e.network.includes('TNT')).length,
    nbc: BETTING_EXPERTS.filter(e => e.network.includes('NBC')).length,
    nflNetwork: BETTING_EXPERTS.filter(e => e.network.includes('NFL Network')).length,
    barstool: BETTING_EXPERTS.filter(e => e.network.includes('Barstool')).length,
    ringer: BETTING_EXPERTS.filter(e => e.network.includes('Ringer')).length,
    independent: BETTING_EXPERTS.filter(e => e.network === 'Independent').length,
  },
  byType: {
    tv: BETTING_EXPERTS.filter(e => e.type === 'tv').length,
    radio: BETTING_EXPERTS.filter(e => e.type === 'radio').length,
    podcast: BETTING_EXPERTS.filter(e => e.type === 'podcast').length,
    sharp: BETTING_EXPERTS.filter(e => e.type === 'sharp').length,
    writer: BETTING_EXPERTS.filter(e => e.type === 'writer').length,
    social: BETTING_EXPERTS.filter(e => e.type === 'social').length,
  },
}
