/**
 * Seed More Cappers - TV personalities, College Football/Basketball analysts, and more
 * Run with: npx tsx scripts/seed-more-cappers.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cdfdmkntdsfylososgwo.supabase.co',
  '***REMOVED***'
)

// Comprehensive list of TV personalities, analysts, and sharps who make public picks
const moreCappers = [
  // ============================================
  // ESPN - NFL/GENERAL
  // ============================================
  { slug: 'adam-schefter', name: 'Adam Schefter', avatar_emoji: '📱', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Insider', followers_count: '10.2M', is_active: true, is_featured: true },
  { slug: 'dan-orlovsky', name: 'Dan Orlovsky', avatar_emoji: '🎬', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '890K', is_active: true, is_featured: false },
  { slug: 'marcus-spears', name: 'Marcus Spears', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Live', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'ryan-clark', name: 'Ryan Clark', avatar_emoji: '🔰', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'Get Up', followers_count: '980K', is_active: true, is_featured: false },
  { slug: 'louis-riddick', name: 'Louis Riddick', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'Monday Night Countdown', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'rex-ryan', name: 'Rex Ryan', avatar_emoji: '👟', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '890K', is_active: true, is_featured: false },
  { slug: 'booger-mcfarland', name: 'Booger McFarland', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'robert-griffin-iii', name: 'Robert Griffin III', avatar_emoji: '🏃', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '1.8M', is_active: true, is_featured: true },
  { slug: 'tedy-bruschi', name: 'Tedy Bruschi', avatar_emoji: '🦁', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'bart-scott', name: 'Bart Scott', avatar_emoji: '😤', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NFL Analyst', followers_count: '234K', is_active: true, is_featured: false },
  
  // ESPN - NBA
  { slug: 'kendrick-perkins', name: 'Kendrick Perkins', avatar_emoji: '🔥', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'First Take', followers_count: '1.8M', is_active: true, is_featured: true },
  { slug: 'jj-redick', name: 'JJ Redick', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Countdown', followers_count: '2.1M', is_active: true, is_featured: true },
  { slug: 'richard-jefferson', name: 'Richard Jefferson', avatar_emoji: '😂', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Analyst', followers_count: '1.3M', is_active: true, is_featured: false },
  { slug: 'tim-legler', name: 'Tim Legler', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Analyst', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'brian-windhorst', name: 'Brian Windhorst', avatar_emoji: '📝', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Reporter', followers_count: '1.2M', is_active: true, is_featured: false },
  { slug: 'doris-burke', name: 'Doris Burke', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Analyst', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'zach-lowe', name: 'Zach Lowe', avatar_emoji: '📊', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'NBA Analyst', followers_count: '678K', is_active: true, is_featured: false },
  
  // ============================================
  // ESPN - COLLEGE FOOTBALL
  // ============================================
  { slug: 'kirk-herbstreit', name: 'Kirk Herbstreit', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay', followers_count: '2.4M', is_active: true, is_featured: true },
  { slug: 'lee-corso', name: 'Lee Corso', avatar_emoji: '🎭', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'desmond-howard', name: 'Desmond Howard', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay', followers_count: '567K', is_active: true, is_featured: true },
  { slug: 'rece-davis', name: 'Rece Davis', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay Host', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'david-pollack', name: 'David Pollack', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'pat-mcafee-college', name: 'Pat McAfee (College)', avatar_emoji: '🎭', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay', followers_count: '5.8M', is_active: true, is_featured: true },
  { slug: 'nick-saban', name: 'Nick Saban', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College GameDay Analyst', followers_count: '1.2M', is_active: true, is_featured: true },
  { slug: 'joey-galloway', name: 'Joey Galloway', avatar_emoji: '⚡', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CFB Analyst', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'jesse-palmer', name: 'Jesse Palmer', avatar_emoji: '🌹', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CFB Analyst', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'greg-mcelroy', name: 'Greg McElroy', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CFB Analyst', followers_count: '345K', is_active: true, is_featured: false },
  
  // ============================================
  // ESPN - COLLEGE BASKETBALL
  // ============================================
  { slug: 'jay-bilas', name: 'Jay Bilas', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College Basketball Analyst', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'dick-vitale', name: 'Dick Vitale', avatar_emoji: '🎤', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'College Basketball Legend', followers_count: '1.2M', is_active: true, is_featured: true },
  { slug: 'seth-greenberg', name: 'Seth Greenberg', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CBB Analyst', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'jay-williams', name: 'Jay Williams', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CBB Analyst', followers_count: '678K', is_active: true, is_featured: true },
  { slug: 'fran-fraschilla', name: 'Fran Fraschilla', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CBB Analyst', followers_count: '156K', is_active: true, is_featured: false },
  { slug: 'dan-dakich', name: 'Dan Dakich', avatar_emoji: '📻', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CBB Analyst', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'laPhonso-ellis', name: 'LaPhonso Ellis', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'CBB Analyst', followers_count: '123K', is_active: true, is_featured: false },
  
  // ============================================
  // FOX SPORTS / FS1
  // ============================================
  { slug: 'michael-strahan', name: 'Michael Strahan', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'FOX NFL Sunday', followers_count: '4.5M', is_active: true, is_featured: true },
  { slug: 'terry-bradshaw', name: 'Terry Bradshaw', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'FOX NFL Sunday', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'howie-long', name: 'Howie Long', avatar_emoji: '💪', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'FOX NFL Sunday', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'jimmy-johnson', name: 'Jimmy Johnson', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'FOX NFL Sunday', followers_count: '456K', is_active: true, is_featured: true },
  { slug: 'rob-parker', name: 'Rob Parker', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'Undisputed', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'joy-taylor', name: 'Joy Taylor', avatar_emoji: '💎', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'The Herd', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'emmanuel-acho', name: 'Emmanuel Acho', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'Speak', followers_count: '1.1M', is_active: true, is_featured: true },
  { slug: 'chris-broussard', name: 'Chris Broussard', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'First Things First', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'craig-carton', name: 'Craig Carton', avatar_emoji: '🎲', verified: true, capper_type: 'celebrity', network: 'FS1', role: 'The Carton Show', followers_count: '234K', is_active: true, is_featured: false },
  
  // ============================================
  // FOX - COLLEGE FOOTBALL
  // ============================================
  { slug: 'urban-meyer', name: 'Urban Meyer', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'matt-leinart', name: 'Matt Leinart', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'reggie-bush', name: 'Reggie Bush', avatar_emoji: '🏃', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff', followers_count: '1.2M', is_active: true, is_featured: true },
  { slug: 'brady-quinn', name: 'Brady Quinn', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'rob-stone', name: 'Rob Stone', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff Host', followers_count: '156K', is_active: true, is_featured: false },
  { slug: 'mark-ingram', name: 'Mark Ingram', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'FOX', role: 'Big Noon Kickoff', followers_count: '567K', is_active: true, is_featured: false },
  
  // ============================================
  // CBS SPORTS
  // ============================================
  { slug: 'jim-nantz', name: 'Jim Nantz', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL/NCAA Play-by-Play', followers_count: '567K', is_active: true, is_featured: true },
  { slug: 'phil-simms', name: 'Phil Simms', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Analyst', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'boomer-esiason', name: 'Boomer Esiason', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Today', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'nate-burleson', name: 'Nate Burleson', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Today', followers_count: '567K', is_active: true, is_featured: true },
  { slug: 'bill-cowher', name: 'Bill Cowher', avatar_emoji: '🏆', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Today', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'charles-davis', name: 'Charles Davis', avatar_emoji: '🎯', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'NFL Analyst', followers_count: '156K', is_active: true, is_featured: false },
  
  // CBS - College Basketball
  { slug: 'clark-kellogg', name: 'Clark Kellogg', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'March Madness Analyst', followers_count: '234K', is_active: true, is_featured: true },
  { slug: 'charles-barkley-cbb', name: 'Charles Barkley (CBB)', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'March Madness', followers_count: '3.2M', is_active: true, is_featured: true },
  { slug: 'kenny-smith-cbb', name: 'Kenny Smith (CBB)', avatar_emoji: '✈️', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'March Madness', followers_count: '1.8M', is_active: true, is_featured: false },
  { slug: 'grant-hill', name: 'Grant Hill', avatar_emoji: '🏀', verified: true, capper_type: 'celebrity', network: 'CBS', role: 'March Madness Analyst', followers_count: '567K', is_active: true, is_featured: true },
  
  // ============================================
  // TNT / TURNER
  // ============================================
  { slug: 'kenny-smith', name: 'Kenny Smith', avatar_emoji: '✈️', verified: true, capper_type: 'celebrity', network: 'TNT', role: 'Inside the NBA', followers_count: '1.8M', is_active: true, is_featured: false },
  { slug: 'ernie-johnson', name: 'Ernie Johnson', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'TNT', role: 'Inside the NBA Host', followers_count: '890K', is_active: true, is_featured: false },
  { slug: 'draymond-green', name: 'Draymond Green', avatar_emoji: '💚', verified: true, capper_type: 'celebrity', network: 'TNT', role: 'Inside the NBA', followers_count: '4.2M', is_active: true, is_featured: true },
  
  // ============================================
  // NBC SPORTS
  // ============================================
  { slug: 'tony-dungy', name: 'Tony Dungy', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'NBC', role: 'Football Night in America', followers_count: '1.5M', is_active: true, is_featured: true },
  { slug: 'rodney-harrison', name: 'Rodney Harrison', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'NBC', role: 'Football Night in America', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'chris-simms', name: 'Chris Simms', avatar_emoji: '📊', verified: true, capper_type: 'celebrity', network: 'NBC', role: 'Pro Football Talk', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'mike-florio', name: 'Mike Florio', avatar_emoji: '📱', verified: true, capper_type: 'celebrity', network: 'NBC', role: 'Pro Football Talk', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'jason-garrett', name: 'Jason Garrett', avatar_emoji: '👏', verified: true, capper_type: 'celebrity', network: 'NBC', role: 'NBC Analyst', followers_count: '234K', is_active: true, is_featured: false },
  
  // ============================================
  // NFL NETWORK
  // ============================================
  { slug: 'rich-eisen', name: 'Rich Eisen', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'Rich Eisen Show', followers_count: '1.5M', is_active: true, is_featured: true },
  { slug: 'michael-irvin', name: 'Michael Irvin', avatar_emoji: '⭐', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'NFL GameDay', followers_count: '1.4M', is_active: true, is_featured: true },
  { slug: 'deion-sanders', name: 'Deion Sanders', avatar_emoji: '✨', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'NFL GameDay', followers_count: '3.5M', is_active: true, is_featured: true },
  { slug: 'steve-mariucci', name: 'Steve Mariucci', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'NFL GameDay', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'kurt-warner', name: 'Kurt Warner', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'NFL Analyst', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'james-jones', name: 'James Jones', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'NFL GameDay', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'colleen-wolfe', name: 'Colleen Wolfe', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'Good Morning Football', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'peter-schrager', name: 'Peter Schrager', avatar_emoji: '🦊', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'Good Morning Football', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'kyle-brandt', name: 'Kyle Brandt', avatar_emoji: '💪', verified: true, capper_type: 'celebrity', network: 'NFL Network', role: 'Good Morning Football', followers_count: '567K', is_active: true, is_featured: true },
  
  // ============================================
  // PODCASTERS / MEDIA
  // ============================================
  { slug: 'big-cat-pmt', name: 'Big Cat (PMT)', avatar_emoji: '🐱', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'Pardon My Take', followers_count: '3.5M', is_active: true, is_featured: true },
  { slug: 'pft-commenter', name: 'PFT Commenter', avatar_emoji: '🎭', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'Pardon My Take', followers_count: '2.8M', is_active: true, is_featured: false },
  { slug: 'dan-le-batard', name: 'Dan Le Batard', avatar_emoji: '😎', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'Le Batard Show', followers_count: '1.5M', is_active: true, is_featured: false },
  { slug: 'russillo', name: 'Ryen Russillo', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'The Ringer', followers_count: '890K', is_active: true, is_featured: false },
  { slug: 'chris-long', name: 'Chris Long', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'Green Light Pod', followers_count: '567K', is_active: true, is_featured: false },
  { slug: 'jason-kelce', name: 'Jason Kelce', avatar_emoji: '🦅', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'New Heights', followers_count: '2.3M', is_active: true, is_featured: true },
  { slug: 'travis-kelce', name: 'Travis Kelce', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'Podcast', role: 'New Heights', followers_count: '8.5M', is_active: true, is_featured: true },
  { slug: 'mcafee-aj-hawk', name: 'AJ Hawk', avatar_emoji: '🏈', verified: true, capper_type: 'celebrity', network: 'ESPN', role: 'Pat McAfee Show', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'colin-dunlap', name: 'Colin Dunlap', avatar_emoji: '🎙️', verified: true, capper_type: 'celebrity', network: 'Radio', role: '93.7 The Fan', followers_count: '123K', is_active: true, is_featured: false },
  
  // ============================================
  // BARSTOOL SPORTS
  // ============================================
  { slug: 'frank-the-tank', name: 'Frank the Tank', avatar_emoji: '🍔', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Picks Central', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'mintzy', name: 'Mintzy', avatar_emoji: '🎲', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Picks Central', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'brandon-walker', name: 'Brandon Walker', avatar_emoji: '🤠', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Picks Central', followers_count: '345K', is_active: true, is_featured: false },
  { slug: 'stu-feiner', name: 'Stu Feiner', avatar_emoji: '🐎', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Picks Central', followers_count: '456K', is_active: true, is_featured: true },
  { slug: 'marty-mush', name: 'Marty Mush', avatar_emoji: '🍄', verified: true, capper_type: 'celebrity', network: 'Barstool', role: 'Walk the Line', followers_count: '234K', is_active: true, is_featured: false },
  
  // ============================================
  // THE ATHLETIC / SPORTS WRITERS
  // ============================================
  { slug: 'seth-wickersham', name: 'Seth Wickersham', avatar_emoji: '📝', verified: true, capper_type: 'celebrity', network: 'The Athletic', role: 'NFL Writer', followers_count: '234K', is_active: true, is_featured: false },
  { slug: 'jeff-howe', name: 'Jeff Howe', avatar_emoji: '📱', verified: true, capper_type: 'celebrity', network: 'The Athletic', role: 'Patriots Beat', followers_count: '156K', is_active: true, is_featured: false },
  
  // ============================================
  // ACTION NETWORK / BETTING EXPERTS
  // ============================================
  { slug: 'ras-an', name: 'RAS', avatar_emoji: '🎯', verified: true, capper_type: 'pro', network: 'Action Network', role: 'Pro Bettor', followers_count: '89K', is_active: true, is_featured: false },
  { slug: 'stuckey', name: 'Stuckey', avatar_emoji: '🏀', verified: true, capper_type: 'pro', network: 'Action Network', role: 'NBA Analyst', followers_count: '67K', is_active: true, is_featured: false },
  { slug: 'bj-cunningham', name: 'BJ Cunningham', avatar_emoji: '📊', verified: true, capper_type: 'pro', network: 'Action Network', role: 'CBB Expert', followers_count: '45K', is_active: true, is_featured: false },
  { slug: 'darren-rovell', name: 'Darren Rovell', avatar_emoji: '💰', verified: true, capper_type: 'celebrity', network: 'Action Network', role: 'Business of Sports', followers_count: '2.1M', is_active: true, is_featured: true },
  
  // ============================================
  // PROFESSIONAL SHARPS
  // ============================================
  { slug: 'steve-fezzik', name: 'Steve Fezzik', avatar_emoji: '🏆', verified: true, capper_type: 'pro', network: 'Independent', role: 'Westgate SuperContest Champ', followers_count: '67K', is_active: true, is_featured: true },
  { slug: 'captain-jack', name: 'Captain Jack', avatar_emoji: '🏴‍☠️', verified: true, capper_type: 'pro', network: 'Independent', role: 'NFL Sharp', followers_count: '89K', is_active: true, is_featured: true },
  { slug: 'gadget', name: 'Gadget', avatar_emoji: '🎮', verified: true, capper_type: 'pro', network: 'Twitter', role: 'Props Sharp', followers_count: '234K', is_active: true, is_featured: true },
  { slug: 'el-tracker', name: 'ElTracker', avatar_emoji: '📈', verified: true, capper_type: 'pro', network: 'Action Network', role: 'CLV Specialist', followers_count: '112K', is_active: true, is_featured: true },
  { slug: 'spanky', name: 'Spanky', avatar_emoji: '🎲', verified: true, capper_type: 'pro', network: 'Covers', role: 'Multi-Sport Sharp', followers_count: '78K', is_active: true, is_featured: false },
  { slug: 'oddsjam-alex', name: 'Alex (OddsJam)', avatar_emoji: '🔧', verified: true, capper_type: 'pro', network: 'OddsJam', role: '+EV Specialist', followers_count: '156K', is_active: true, is_featured: false },
  { slug: 'unabated-sharp', name: 'Unabated', avatar_emoji: '📊', verified: true, capper_type: 'pro', network: 'Unabated', role: 'Line Movement Expert', followers_count: '89K', is_active: true, is_featured: false },
  
  // ============================================
  // TWITTER / SOCIAL MEDIA PERSONALITIES
  // ============================================
  { slug: 'pickdawgz', name: 'Pickdawgz', avatar_emoji: '🐕', verified: true, capper_type: 'community', network: 'Twitter', role: 'Sports Picks', followers_count: '456K', is_active: true, is_featured: false },
  { slug: 'underdogfantasy', name: 'Underdog Fantasy', avatar_emoji: '🐶', verified: true, capper_type: 'community', network: 'App', role: 'Fantasy/Props', followers_count: '890K', is_active: true, is_featured: true },
  { slug: 'prizepicks', name: 'PrizePicks', avatar_emoji: '🎯', verified: true, capper_type: 'community', network: 'App', role: 'Props Platform', followers_count: '1.2M', is_active: true, is_featured: true },
]

async function seedMoreCappers() {
  console.log('Seeding additional cappers...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const capper of moreCappers) {
    const { error } = await supabase
      .from('cappers')
      .upsert(capper, { onConflict: 'slug' })
    
    if (error) {
      console.error(`❌ Error seeding ${capper.name}:`, error.message)
      errorCount++
    } else {
      console.log(`✓ ${capper.name} (${capper.network})`)
      successCount++
    }
  }
  
  console.log(`\n=== Seeding Complete ===`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Get final count
  const { count } = await supabase
    .from('cappers')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\nTotal cappers in database: ${count}`)
  
  // Show breakdown by network
  const { data: networks } = await supabase
    .from('cappers')
    .select('network')
  
  const networkCounts: Record<string, number> = {}
  networks?.forEach(n => {
    networkCounts[n.network || 'Unknown'] = (networkCounts[n.network || 'Unknown'] || 0) + 1
  })
  
  console.log('\nBy Network:')
  Object.entries(networkCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([network, count]) => {
      console.log(`  ${network}: ${count}`)
    })
}

seedMoreCappers().catch(console.error)
