const API_KEY = import.meta.env.VITE_RAWG_API_KEY

export async function searchGames(query) {
  const response = await fetch(
    `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=12`
  )
  const data = await response.json()
  return data.results
}

// Fetch free-to-play games using RAWG API
export async function fetchFreeGames(pageSize = 12) {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&tags=free-to-play&page_size=${pageSize}`
    )
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error fetching free games from RAWG:", error)
    return []
  }
}

// Fetch games from the dedicated FreeToGame API
export async function fetchFreeToGameApi() {
  try {
    // Note: FreeToGame API might require a CORS proxy if called directly from the browser
    const response = await fetch('https://www.freetogame.com/api/games')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching from FreeToGame API:", error)
    return []
  }
}