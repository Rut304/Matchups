import { NextResponse } from 'next/server'

// Mock injury data - in production, this would fetch from a sports data API
const mockInjuries = [
  // NFL Injuries
  { id: '1', playerId: 'mahomes-patrick', name: 'Patrick Mahomes', team: 'KC', position: 'QB', sport: 'NFL', injury: 'Ankle Sprain', status: 'Questionable' as const },
  { id: '2', playerId: 'kelce-travis', name: 'Travis Kelce', team: 'KC', position: 'TE', sport: 'NFL', injury: 'Knee', status: 'Probable' as const },
  { id: '3', playerId: 'hill-tyreek', name: 'Tyreek Hill', team: 'MIA', position: 'WR', sport: 'NFL', injury: 'Hip', status: 'Questionable' as const },
  { id: '4', playerId: 'waddle-jaylen', name: 'Jaylen Waddle', team: 'MIA', position: 'WR', sport: 'NFL', injury: 'Ankle', status: 'Probable' as const },
  { id: '5', playerId: 'allen-josh', name: 'Josh Allen', team: 'BUF', position: 'QB', sport: 'NFL', injury: 'Elbow', status: 'Probable' as const },
  { id: '6', playerId: 'diggs-stefon', name: 'Stefon Diggs', team: 'HOU', position: 'WR', sport: 'NFL', injury: 'Knee', status: 'Out' as const },
  { id: '7', playerId: 'chubb-nick', name: 'Nick Chubb', team: 'CLE', position: 'RB', sport: 'NFL', injury: 'Knee', status: 'IR' as const },
  { id: '8', playerId: 'watson-deshaun', name: 'Deshaun Watson', team: 'CLE', position: 'QB', sport: 'NFL', injury: 'Shoulder', status: 'Out' as const },
  { id: '9', playerId: 'garrett-myles', name: 'Myles Garrett', team: 'CLE', position: 'DE', sport: 'NFL', injury: 'Foot', status: 'Questionable' as const },
  { id: '10', playerId: 'jackson-lamar', name: 'Lamar Jackson', team: 'BAL', position: 'QB', sport: 'NFL', injury: 'Back', status: 'Probable' as const },
  { id: '11', playerId: 'henry-derrick', name: 'Derrick Henry', team: 'BAL', position: 'RB', sport: 'NFL', injury: 'Hamstring', status: 'Questionable' as const },
  { id: '12', playerId: 'chase-jamarr', name: "Ja'Marr Chase", team: 'CIN', position: 'WR', sport: 'NFL', injury: 'Quad', status: 'Probable' as const },
  { id: '13', playerId: 'burrow-joe', name: 'Joe Burrow', team: 'CIN', position: 'QB', sport: 'NFL', injury: 'Wrist', status: 'Probable' as const },
  { id: '14', playerId: 'lamb-ceedee', name: 'CeeDee Lamb', team: 'DAL', position: 'WR', sport: 'NFL', injury: 'Shoulder', status: 'Questionable' as const },
  { id: '15', playerId: 'parsons-micah', name: 'Micah Parsons', team: 'DAL', position: 'LB', sport: 'NFL', injury: 'Ankle', status: 'Doubtful' as const },
  { id: '16', playerId: 'jefferson-justin', name: 'Justin Jefferson', team: 'MIN', position: 'WR', sport: 'NFL', injury: 'Hamstring', status: 'Out' as const },
  { id: '17', playerId: 'smith-devonta', name: 'DeVonta Smith', team: 'PHI', position: 'WR', sport: 'NFL', injury: 'Concussion', status: 'Out' as const },
  { id: '18', playerId: 'hurts-jalen', name: 'Jalen Hurts', team: 'PHI', position: 'QB', sport: 'NFL', injury: 'Knee', status: 'Questionable' as const },
  { id: '19', playerId: 'barkley-saquon', name: 'Saquon Barkley', team: 'PHI', position: 'RB', sport: 'NFL', injury: 'Ankle', status: 'Probable' as const },
  { id: '20', playerId: 'mccaffrey-christian', name: 'Christian McCaffrey', team: 'SF', position: 'RB', sport: 'NFL', injury: 'Calf', status: 'IR' as const },

  // NBA Injuries
  { id: '21', playerId: 'brown-jaylen', name: 'Jaylen Brown', team: 'BOS', position: 'SG', sport: 'NBA', injury: 'Hamstring', status: 'Out' as const },
  { id: '22', playerId: 'tatum-jayson', name: 'Jayson Tatum', team: 'BOS', position: 'SF', sport: 'NBA', injury: 'Ankle', status: 'Probable' as const },
  { id: '23', playerId: 'james-lebron', name: 'LeBron James', team: 'LAL', position: 'SF', sport: 'NBA', injury: 'Knee', status: 'GTD' as const },
  { id: '24', playerId: 'davis-anthony', name: 'Anthony Davis', team: 'LAL', position: 'PF', sport: 'NBA', injury: 'Back', status: 'Questionable' as const },
  { id: '25', playerId: 'curry-stephen', name: 'Stephen Curry', team: 'GSW', position: 'PG', sport: 'NBA', injury: 'Ankle', status: 'Probable' as const },
  { id: '26', playerId: 'thompson-klay', name: 'Klay Thompson', team: 'DAL', position: 'SG', sport: 'NBA', injury: 'Knee', status: 'Questionable' as const },
  { id: '27', playerId: 'doncic-luka', name: 'Luka Doncic', team: 'DAL', position: 'PG', sport: 'NBA', injury: 'Calf', status: 'Day-to-Day' as const },
  { id: '28', playerId: 'irving-kyrie', name: 'Kyrie Irving', team: 'DAL', position: 'PG', sport: 'NBA', injury: 'Shoulder', status: 'Probable' as const },
  { id: '29', playerId: 'embiid-joel', name: 'Joel Embiid', team: 'PHI', position: 'C', sport: 'NBA', injury: 'Knee', status: 'Out' as const },
  { id: '30', playerId: 'george-paul', name: 'Paul George', team: 'PHI', position: 'SF', sport: 'NBA', injury: 'Hamstring', status: 'Questionable' as const },
  { id: '31', playerId: 'durant-kevin', name: 'Kevin Durant', team: 'PHX', position: 'SF', sport: 'NBA', injury: 'Calf', status: 'Out' as const },
  { id: '32', playerId: 'booker-devin', name: 'Devin Booker', team: 'PHX', position: 'SG', sport: 'NBA', injury: 'Groin', status: 'Questionable' as const },
  { id: '33', playerId: 'antetokounmpo-giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', sport: 'NBA', injury: 'Knee', status: 'Day-to-Day' as const },
  { id: '34', playerId: 'lillard-damian', name: 'Damian Lillard', team: 'MIL', position: 'PG', sport: 'NBA', injury: 'Calf', status: 'Probable' as const },
  { id: '35', playerId: 'morant-ja', name: 'Ja Morant', team: 'MEM', position: 'PG', sport: 'NBA', injury: 'Shoulder', status: 'Out' as const },
  { id: '36', playerId: 'leonard-kawhi', name: 'Kawhi Leonard', team: 'LAC', position: 'SF', sport: 'NBA', injury: 'Knee', status: 'Out' as const },
  { id: '37', playerId: 'george-paul-2', name: 'James Harden', team: 'LAC', position: 'PG', sport: 'NBA', injury: 'Hamstring', status: 'Questionable' as const },

  // NHL Injuries
  { id: '38', playerId: 'mcdavid-connor', name: 'Connor McDavid', team: 'EDM', position: 'C', sport: 'NHL', injury: 'Lower Body', status: 'Day-to-Day' as const },
  { id: '39', playerId: 'draisaitl-leon', name: 'Leon Draisaitl', team: 'EDM', position: 'C', sport: 'NHL', injury: 'Upper Body', status: 'Probable' as const },
  { id: '40', playerId: 'matthews-auston', name: 'Auston Matthews', team: 'TOR', position: 'C', sport: 'NHL', injury: 'Knee', status: 'Out' as const },
  { id: '41', playerId: 'marner-mitch', name: 'Mitch Marner', team: 'TOR', position: 'RW', sport: 'NHL', injury: 'Ankle', status: 'Questionable' as const },
  { id: '42', playerId: 'crosby-sidney', name: 'Sidney Crosby', team: 'PIT', position: 'C', sport: 'NHL', injury: 'Upper Body', status: 'Questionable' as const },
  { id: '43', playerId: 'malkin-evgeni', name: 'Evgeni Malkin', team: 'PIT', position: 'C', sport: 'NHL', injury: 'Lower Body', status: 'Probable' as const },
  { id: '44', playerId: 'mackinnon-nathan', name: 'Nathan MacKinnon', team: 'COL', position: 'C', sport: 'NHL', injury: 'Upper Body', status: 'Day-to-Day' as const },
  { id: '45', playerId: 'makar-cale', name: 'Cale Makar', team: 'COL', position: 'D', sport: 'NHL', injury: 'Shoulder', status: 'Out' as const },
  { id: '46', playerId: 'ovechkin-alex', name: 'Alex Ovechkin', team: 'WSH', position: 'LW', sport: 'NHL', injury: 'Lower Body', status: 'IR' as const },
  { id: '47', playerId: 'kucherov-nikita', name: 'Nikita Kucherov', team: 'TBL', position: 'RW', sport: 'NHL', injury: 'Groin', status: 'Questionable' as const },
  { id: '48', playerId: 'hedman-victor', name: 'Victor Hedman', team: 'TBL', position: 'D', sport: 'NHL', injury: 'Back', status: 'Probable' as const },

  // MLB Injuries
  { id: '49', playerId: 'trout-mike', name: 'Mike Trout', team: 'LAA', position: 'CF', sport: 'MLB', injury: 'Knee', status: 'IR' as const },
  { id: '50', playerId: 'ohtani-shohei', name: 'Shohei Ohtani', team: 'LAD', position: 'DH', sport: 'MLB', injury: 'UCL', status: 'Day-to-Day' as const },
  { id: '51', playerId: 'betts-mookie', name: 'Mookie Betts', team: 'LAD', position: 'SS', sport: 'MLB', injury: 'Hand', status: 'Questionable' as const },
  { id: '52', playerId: 'judge-aaron', name: 'Aaron Judge', team: 'NYY', position: 'RF', sport: 'MLB', injury: 'Hip', status: 'Probable' as const },
  { id: '53', playerId: 'soto-juan', name: 'Juan Soto', team: 'NYY', position: 'RF', sport: 'MLB', injury: 'Forearm', status: 'Day-to-Day' as const },
  { id: '54', playerId: 'acuna-ronald', name: 'Ronald Acuña Jr.', team: 'ATL', position: 'RF', sport: 'MLB', injury: 'Knee', status: 'IR' as const },
  { id: '55', playerId: 'tatis-fernando', name: 'Fernando Tatis Jr.', team: 'SD', position: 'RF', sport: 'MLB', injury: 'Shoulder', status: 'Questionable' as const },
  { id: '56', playerId: 'machado-manny', name: 'Manny Machado', team: 'SD', position: '3B', sport: 'MLB', injury: 'Hip', status: 'Probable' as const },
  { id: '57', playerId: 'lindor-francisco', name: 'Francisco Lindor', team: 'NYM', position: 'SS', sport: 'MLB', injury: 'Back', status: 'Questionable' as const },
  { id: '58', playerId: 'devers-rafael', name: 'Rafael Devers', team: 'BOS', position: '3B', sport: 'MLB', injury: 'Shoulder', status: 'Day-to-Day' as const },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const status = searchParams.get('status')
  const team = searchParams.get('team')

  let injuries = [...mockInjuries]

  // Filter by sport
  if (sport && sport !== 'all') {
    injuries = injuries.filter(i => i.sport.toUpperCase() === sport.toUpperCase())
  }

  // Filter by status
  if (status && status !== 'all') {
    injuries = injuries.filter(i => i.status === status)
  }

  // Filter by team
  if (team) {
    injuries = injuries.filter(i => i.team.toUpperCase() === team.toUpperCase())
  }

  return NextResponse.json({
    injuries,
    count: injuries.length,
    lastUpdated: new Date().toISOString()
  })
}
