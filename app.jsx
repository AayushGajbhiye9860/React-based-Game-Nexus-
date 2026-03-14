import { useState, useEffect } from "react"
import { fetchGames, searchGames } from "./API/gamedistribution"

// Custom backend base URL
const API_BASE_URL = "http://localhost:3001"

function App() {
  const [query, setQuery] = useState("")
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("discover") // discover | trending | new
  const [showSignIn, setShowSignIn] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authRemember, setAuthRemember] = useState(true)
  const [authError, setAuthError] = useState("")
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authUsername, setAuthUsername] = useState("")

  // Initial load
  useEffect(() => {
    async function loadInitialGames() {
      setLoading(true)
      try {
        const initialGames = await fetchGames(50)
        setGames(initialGames || [])
      } catch (err) {
        console.error("Failed to fetch initial games", err)
      } finally {
        setLoading(false)
      }
    }
    loadInitialGames()
    
    // Check if user is logged in (from local storage for simple persistence)
    const storedUser = localStorage.getItem("gameNexusUser")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse stored user", e)
      }
    }
  }, [])

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    setActiveCategory("All")
    setActiveTab("discover")
    try {
      const results = await searchGames(query)
      setGames(results || [])
    } catch (err) {
      console.error("Failed to fetch games", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGameClick(game) {
    setSelectedGame(game)
    
    // Save to Database if user is logged in
    if (user && user.id) {
      try {
        const imageAsset = game.Asset && game.Asset.length > 0 ? game.Asset[0] : null
        await fetch(`${API_BASE_URL}/save-game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            gameTitle: game.Title,
            gameUrl: game.Url,
            gameImage: imageAsset
          })
        })
      } catch (err) {
        console.error("Failed to save game to history:", err)
      }
    }
  }

  function closeModal() {
    setSelectedGame(null)
  }

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Build category chips from loaded games
  const categorySet = new Set()
  games.forEach((game) => {
    if (Array.isArray(game.Category)) {
      game.Category.forEach((c) => categorySet.add(c))
    }
  })
  const categories = Array.from(categorySet).slice(0, 8)

  // Tab logic: discover / trending / new drops
  let tabGames = games
  if (activeTab === "trending") {
    // Show a dedicated "trending" view with the most‑played games
    tabGames = [...games]
      .filter((g) => typeof g.Plays === "number")
      .sort((a, b) => {
        const aPlays = typeof a.Plays === "number" ? a.Plays : 0
        const bPlays = typeof b.Plays === "number" ? b.Plays : 0
        return bPlays - aPlays
      })
      .slice(0, 24) // top 24 trending games
  } else if (activeTab === "new") {
    tabGames = [...games].reverse()
  }

  const displayedGames =
    activeCategory === "All"
      ? tabGames
      : tabGames.filter((game) =>
        Array.isArray(game.Category)
          ? game.Category.includes(activeCategory)
          : false
      )

  function handleNavClick(tab) {
    setActiveTab(tab)
    setActiveCategory("All")
  }

  function handleOpenSignIn() {
    setShowSignIn(true)
  }

  function handleCloseSignIn() {
    setShowSignIn(false)
    setAuthError("")
  }

  async function handleSignInSubmit(e) {
    e.preventDefault()
    setAuthError("")
    
    if (isSignUp && !authUsername) {
      setAuthError("Please enter a username.")
      return
    }

    if (!authEmail || !authPassword) {
      setAuthError("Please enter both email and password.")
      return
    }
    setAuthSubmitting(true)
    
    try {
      const endpoint = isSignUp ? "/register" : "/login"
      const bodyParams = isSignUp 
        ? { username: authUsername, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyParams)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      // Success
      setUser(data.user)
      if (authRemember) {
        localStorage.setItem("gameNexusUser", JSON.stringify(data.user))
      }
      handleCloseSignIn()
    } catch (err) {
      setAuthError(err.message || "Something went wrong. Please try again.")
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleSignOut() {
    setUser(null)
    localStorage.removeItem("gameNexusUser")
  }

  return (
    <div className="app-shell">
      {/* Top navigation */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo-mark">GX</div>
          <div className="brand-copy">
            <span className="brand-title">Game Nexus</span>
            <span className="brand-subtitle">Play instantly in your browser</span>
          </div>
        </div>
        <nav className="nav-links">
          <button
            className={
              activeTab === "discover" ? "nav-pill nav-pill-active" : "nav-pill"
            }
            type="button"
            onClick={() => handleNavClick("discover")}
          >
            Discover
          </button>
          <button
            className={
              activeTab === "trending" ? "nav-pill nav-pill-active" : "nav-pill"
            }
            type="button"
            onClick={() => handleNavClick("trending")}
          >
            Trending
          </button>
          <button
            className={activeTab === "new" ? "nav-pill nav-pill-active" : "nav-pill"}
            type="button"
            onClick={() => handleNavClick("new")}
          >
            New Drops
          </button>
        </nav>
        <button className="nav-cta" type="button" onClick={user ? handleSignOut : handleOpenSignIn}>
          {user ? "Sign out" : "Sign in"}
        </button>
      </header>

      {showSignIn ? (
        <main className="auth-main">
          <section className="auth-shell" style={isSignUp ? { flexDirection: "row-reverse" } : {}}>
            <div className="auth-card">
              <div className="auth-card-header">
                <h1 className="auth-title">
                  {isSignUp ? "Create your account." : "Welcome back, gamer."}
                </h1>
                <p className="auth-subtitle">
                  {isSignUp
                    ? "Join the network to sync favorites, keep your history, and pick up right where you left off."
                    : "Sign in to sync favorites, keep your history, and pick up right where you left off."}
                </p>
              </div>
              <form className="auth-form" onSubmit={handleSignInSubmit}>
                {isSignUp && (
                  <label className="auth-label">
                    Username
                    <input
                      type="text"
                      className="auth-input"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="GamerTag123"
                    />
                  </label>
                )}
                <label className="auth-label">
                  Email
                  <input
                    type="email"
                    className="auth-input"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.gg"
                  />
                </label>
                <label className="auth-label">
                  Password
                  <input
                    type="password"
                    className="auth-input"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>
                <div className="auth-row">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={authRemember}
                      onChange={(e) => setAuthRemember(e.target.checked)}
                    />
                    <span>Keep me signed in on this device</span>
                  </label>
                  <button type="button" className="auth-link">
                    Forgot password?
                  </button>
                </div>
                {authError && <div className="auth-error">{authError}</div>}
                <button
                  className="auth-submit"
                  type="submit"
                  disabled={authSubmitting}
                >
                  {authSubmitting ? (isSignUp ? "Creating account..." : "Signing you in...") : (isSignUp ? "Sign up" : "Sign in")}
                </button>
                <div className="auth-divider">
                  <span />
                  <span>or continue with</span>
                  <span />
                </div>
                <div className="auth-social-row">
                  <button type="button" className="auth-social" disabled>
                    Google
                  </button>
                  <button type="button" className="auth-social" disabled>
                    Discord
                  </button>
                  <button type="button" className="auth-social" disabled>
                    Xbox
                  </button>
                </div>
                <p className="auth-footer-text">
                  {isSignUp ? "Already have an account?" : "New here?"}{" "}
                  <span className="auth-link-text" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? "Sign in" : "Create a free account"}
                  </span>
                </p>
              </form>
              <button
                type="button"
                className="auth-back-link"
                onClick={handleCloseSignIn}
              >
                ← Back to arcade
              </button>
            </div>
            <div className="auth-side-panel">
              <div className="auth-side-glow" />
              <h2>
                {isSignUp ? "Your games, your rules." : "All your sessions, everywhere."}
              </h2>
              <p>
                {isSignUp
                  ? "Sign up today to get your own arcade dashboard. We'll track your progression and favorites across all devices."
                  : "We'll keep your play history, favorites, and last‑played games synced across desktop and mobile so you can drop in anytime."}
              </p>
            </div>
          </section>
        </main>
      ) : (
        <main className="app-main">
          <section className="app-container hero">
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">Curated for gamers</p>
                <h1 className="title-gradient">Drop into the arcade.</h1>
                <p className="subtitle">
                  Search across genres, discover new favorites, and jump straight
                  into high‑quality HTML5 games. No installs. No friction. Just play.
                </p>
                <div className="hero-stats">
                  <div className="stat-pill">
                    <span className="stat-label">Games live</span>
                    <span className="stat-value">{games.length || "—"}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-label">Latency</span>
                    <span className="stat-value">Ultra‑low</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-label">Platform</span>
                    <span className="stat-value">Web & Mobile</span>
                  </div>
                </div>
              </div>
            </div>

            <form className="search-container" onSubmit={handleSearch}>
              <input
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, franchise, or genre (e.g. Roguelike, Racing, Puzzle)..."
              />
              <button className="search-button" type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            {categories.length > 0 && (
              <div className="filter-bar">
                <span className="filter-label">Browse by genre</span>
                <div className="filter-chips">
                  <button
                    type="button"
                    className={
                      activeCategory === "All"
                        ? "filter-chip filter-chip-active"
                        : "filter-chip"
                    }
                    onClick={() => setActiveCategory("All")}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={
                        activeCategory === cat
                          ? "filter-chip filter-chip-active"
                          : "filter-chip"
                      }
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="app-container">
            {loading && (
              <div className="loader-container">
                <div className="loader"></div>
                <p>Booting up the arcade...</p>
              </div>
            )}

            {!loading && displayedGames.length === 0 && (
              <div className="empty-state">
                No games found. Try a different title or genre.
              </div>
            )}

            {!loading && displayedGames.length > 0 && (
              <div className="results-meta">
                <span className="results-count">
                  Showing {displayedGames.length} game
                  {displayedGames.length !== 1 ? "s" : ""}{" "}
                  {activeCategory !== "All" && `in ${activeCategory}`}
                </span>
              </div>
            )}

            {/* Grid view of games */}
            <div className="games-grid">
              {displayedGames.map((game) => {
                const imageAsset =
                  game.Asset && game.Asset.length > 0 ? game.Asset[0] : null

                return (
                  <div
                    key={game.Url}
                    className="game-card"
                    onClick={() => handleGameClick(game)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="game-image-container">
                      {imageAsset ? (
                        <img
                          src={imageAsset}
                          alt={game.Title}
                          className="game-image"
                        />
                      ) : (
                        <div
                          style={{
                            background: "#2a2a35",
                            width: "100%",
                            height: "100%",
                          }}
                        ></div>
                      )}
                      <span className="play-now-badge">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          style={{ marginRight: "4px" }}
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play now
                      </span>
                    </div>
                    <div className="game-content">
                      <h3 className="game-title">{game.Title}</h3>
                      {game.Category && (
                        <div className="genres">
                          {game.Category.slice(0, 3).map((c, i) => (
                            <span key={i} className="genre-tag">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="game-meta">
                        <button
                          type="button"
                          className="play-now-button"
                          onClick={() => handleGameClick(game)}
                        >
                          Play now
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      )}

      {/* Playable Game Modal */}
      {selectedGame && !showSignIn && (
        <div className="modal-overlay" onClick={closeModal} style={{ padding: "2rem" }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "900px",
              width: "100%",
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="modal-title" style={{ margin: 0 }}>
                {selectedGame.Title}
              </h2>
              <button
                className="modal-close"
                onClick={closeModal}
                style={{ position: "static" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: "#000",
                width: "100%",
                height: "100%",
              }}
            >
              <iframe
                src={selectedGame.Url}
                title={selectedGame.Title}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; fullscreen; microphone;"
                style={{ display: "block" }}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App