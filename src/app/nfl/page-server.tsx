import { syncGames } from '@/lib/api/data-layer'
import { getScoreboard, getNews } from '@/lib/api/espn'
import NFLPageClient from './NFLPageClient'

export const revalidate = 60 // Revalidate every minute

export default async function NFLPage() {
  let games = []
  let news = []
  
  try {
    // Fetch live game data
    games = await syncGames('NFL')
  } catch (error) {
    console.error('[NFL Page] Failed to fetch games:', error)
  }
  
  try {
    // Fetch latest news
    news = await getNews('NFL', 5)
  } catch (error) {
    console.error('[NFL Page] Failed to fetch news:', error)
  }
  
  return <NFLPageClient initialGames={games} initialNews={news} />
}
