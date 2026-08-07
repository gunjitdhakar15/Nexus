import {
  GetAllGames as WailsGetAllGames,
  GetAltsByGame as WailsGetAltsByGame,
  AddGame as WailsAddGame,
  AddGameWithDetails as WailsAddGameWithDetails,
  AddSteamGames as WailsAddSteamGames,
  UpdateGameWithDetails as WailsUpdateGameWithDetails,
  AddAlt as WailsAddAlt,
  UpdateAlt as WailsUpdateAlt,
  DeleteAlt as WailsDeleteAlt,
  UpdateGame as WailsUpdateGame,
  DeleteGame as WailsDeleteGame,
  UpdateGamePlaytime as WailsUpdateGamePlaytime,
  FetchGameArtwork as WailsFetchGameArtwork,
  FetchSteamLibrary as WailsFetchSteamLibrary,
  GetSettings as WailsGetSettings,
  SaveSettings as WailsSaveSettings,
} from '../../wailsjs/go/main/App'
import { isDesktopApp } from '../utils/env'

export interface Game {
  id: string
  title: string
  coverArt: string
  totalPlaytime: number
  metacritic?: number
  rating?: number
  released?: string
  genres?: string
  rawgId?: number
  steamAppId?: number
}

export interface GameDetails {
  title: string
  coverUrl: string
  rating: number
  metacritic: number
  released: string
  genres: string[]
  rawgId: number
}

export interface SteamGame {
  appId: number
  title: string
  playtimeHours: number
  coverUrl: string
  headerUrl: string
}

export interface AltAccount {
  id: string
  gameId: string
  name: string
  level: number
  playtimeHours: number
  lastPlayed: string
  progress: Record<string, any>
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ========== DEMO DATA (used on the hosted demo site) ==========
const demoGames: Game[] = [
  { id: 'g1', title: 'Valorant', coverArt: '', totalPlaytime: 342 },
  { id: 'g2', title: 'Elden Ring', coverArt: '', totalPlaytime: 187 },
  { id: 'g3', title: 'World of Warcraft', coverArt: '', totalPlaytime: 521 },
  { id: 'g4', title: 'Destiny 2', coverArt: '', totalPlaytime: 96 },
  { id: 'g5', title: 'League of Legends', coverArt: '', totalPlaytime: 264 },
  { id: 'g6', title: 'FIFA', coverArt: '', totalPlaytime: 45 },
]

const demoAlts: Record<string, AltAccount[]> = {
  g1: [
    { id: 'a1', gameId: 'g1', name: 'Main', level: 284, playtimeHours: 210, lastPlayed: '2026-07-28', progress: { Rank: 'Immortal 3', Agent: 'Jett' } },
    { id: 'a2', gameId: 'g1', name: 'Smurf', level: 67, playtimeHours: 89, lastPlayed: '2026-08-01', progress: { Rank: 'Diamond 1', Agent: 'Raze' } },
    { id: 'a3', gameId: 'g1', name: 'AFK Account', level: 12, playtimeHours: 43, lastPlayed: '2026-06-15', progress: {} },
  ],
  g2: [
    { id: 'a4', gameId: 'g2', name: 'Nightmare', level: 172, playtimeHours: 150, lastPlayed: '2026-07-30', progress: { NG: 'NG+3', Boss: 'Malenia' } },
    { id: 'a5', gameId: 'g2', name: 'Glass Cannon', level: 98, playtimeHours: 37, lastPlayed: '2026-05-02', progress: { Boss: 'Radahn' } },
  ],
  g3: [
    { id: 'a6', gameId: 'g3', name: 'Horde Main', level: 70, playtimeHours: 320, lastPlayed: '2026-07-25', progress: { Spec: 'Protection', Guild: 'Raid Ready' } },
  ],
  g4: [
    { id: 'a7', gameId: 'g4', name: 'Hunter', level: 1815, playtimeHours: 96, lastPlayed: '2026-07-20', progress: { Light: '2015', Class: 'Titan' } },
  ],
  g5: [
    { id: 'a8', gameId: 'g5', name: 'Mid Lane Main', level: 350, playtimeHours: 200, lastPlayed: '2026-07-31', progress: { Rank: 'Platinum 2', Champion: 'Yasuo' } },
    { id: 'a9', gameId: 'g5', name: 'Support Alt', level: 120, playtimeHours: 64, lastPlayed: '2026-06-01', progress: { Rank: 'Gold 4', Champion: 'Thresh' } },
  ],
  g6: [
    { id: 'a10', gameId: 'g6', name: 'Ultimate Team', level: 89, playtimeHours: 45, lastPlayed: '2026-07-18', progress: { Division: 'Elite', Mode: 'FUT' } },
  ],
}

// ========== API ==========
// When running inside the Wails desktop app every call goes to the Go
// backend. In a plain browser (demo / GitHub Pages) it falls back to the
// in-memory demo data above.
export const api = {
  async GetAllGames(): Promise<Game[]> {
    if (isDesktopApp()) return WailsGetAllGames()
    await delay(450)
    return demoGames.map((g) => ({ ...g }))
  },

  async GetAltsByGame(gameId: string): Promise<AltAccount[]> {
    if (isDesktopApp()) return WailsGetAltsByGame(gameId)
    await delay(350)
    return (demoAlts[gameId] || []).map((a) => ({ ...a, progress: { ...a.progress } }))
  },

  async AddGame(title: string, coverArt: string): Promise<string> {
    if (isDesktopApp()) return WailsAddGame(title, coverArt)
    await delay(300)
    const id = 'g' + Math.random().toString(36).slice(2, 8)
    demoGames.push({ id, title, coverArt, totalPlaytime: 0 })
    demoAlts[id] = []
    return id
  },

  async AddGameWithDetails(
    title: string,
    coverArt: string,
    metacritic: number,
    rating: number,
    released: string,
    genres: string,
    rawgId: number,
    steamAppId: number
  ): Promise<string> {
    if (isDesktopApp()) return WailsAddGameWithDetails(title, coverArt, metacritic, rating, released, genres, rawgId, steamAppId)
    await delay(300)
    const id = 'g' + Math.random().toString(36).slice(2, 8)
    demoGames.push({ id, title, coverArt, totalPlaytime: 0, metacritic, rating, released, genres, rawgId, steamAppId })
    demoAlts[id] = []
    return id
  },

  async UpdateGameWithDetails(
    id: string,
    title: string,
    coverArt: string,
    metacritic: number,
    rating: number,
    released: string,
    genres: string,
    rawgId: number,
    steamAppId: number
  ): Promise<void> {
    if (isDesktopApp()) return WailsUpdateGameWithDetails(id, title, coverArt, metacritic, rating, released, genres, rawgId, steamAppId)
    await delay(250)
    const game = demoGames.find((g) => g.id === id)
    if (game) {
      game.title = title
      game.coverArt = coverArt
      game.metacritic = metacritic
      game.rating = rating
      game.released = released
      game.genres = genres
      game.rawgId = rawgId
      game.steamAppId = steamAppId
    }
  },

  async AddAlt(gameId: string, name: string, level: number, playtimeHours: number, lastPlayed: string, progress: Record<string, any>): Promise<string> {
    if (isDesktopApp()) return WailsAddAlt(gameId, name, level, playtimeHours, lastPlayed, progress)
    await delay(350)
    const id = 'a' + Math.random().toString(36).slice(2, 8)
    demoAlts[gameId] = demoAlts[gameId] || []
    demoAlts[gameId].push({ id, gameId, name, level, playtimeHours, lastPlayed, progress: { ...progress } })
    return id
  },

  async UpdateAlt(id: string, name: string, level: number, playtimeHours: number, lastPlayed: string, progress: Record<string, any>): Promise<void> {
    if (isDesktopApp()) return WailsUpdateAlt(id, name, level, playtimeHours, lastPlayed, progress)
    await delay(250)
    for (const gameId in demoAlts) {
      const alt = demoAlts[gameId].find((a) => a.id === id)
      if (alt) {
        alt.name = name
        alt.level = level
        alt.playtimeHours = playtimeHours
        alt.lastPlayed = lastPlayed
        alt.progress = { ...progress }
        return
      }
    }
  },

  async DeleteAlt(id: string): Promise<void> {
    if (isDesktopApp()) return WailsDeleteAlt(id)
    await delay(250)
    for (const gameId in demoAlts) {
      demoAlts[gameId] = demoAlts[gameId].filter((a) => a.id !== id)
    }
  },

  async UpdateGame(id: string, title: string, coverArt: string): Promise<void> {
    if (isDesktopApp()) return WailsUpdateGame(id, title, coverArt)
    await delay(250)
    const game = demoGames.find((g) => g.id === id)
    if (game) {
      game.title = title
      game.coverArt = coverArt
    }
  },

  async DeleteGame(id: string): Promise<void> {
    if (isDesktopApp()) return WailsDeleteGame(id)
    await delay(250)
    demoGames.splice(demoGames.findIndex((g) => g.id === id), 1)
    delete demoAlts[id]
  },

  async UpdateGamePlaytime(id: string, playtime: number): Promise<void> {
    if (isDesktopApp()) return WailsUpdateGamePlaytime(id, playtime)
    await delay(150)
    const game = demoGames.find((g) => g.id === id)
    if (game) game.totalPlaytime = playtime
  },

  // ---------- SETTINGS ----------

  async GetSettings(): Promise<Record<string, string>> {
    if (isDesktopApp()) return WailsGetSettings()
    await delay(200)
    try {
      const raw = localStorage.getItem('nexusSettings')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },

  async SaveSettings(settings: Record<string, string>): Promise<void> {
    if (isDesktopApp()) return WailsSaveSettings(settings)
    await delay(200)
    const current = await api.GetSettings()
    localStorage.setItem('nexusSettings', JSON.stringify({ ...current, ...settings }))
  },

  // ---------- RAWG ----------

  async FetchGameArtwork(title: string): Promise<GameDetails> {
    const empty = (): GameDetails => ({ title, coverUrl: '', rating: 0, metacritic: 0, released: '', genres: [], rawgId: 0 })
    if (isDesktopApp()) return WailsFetchGameArtwork(title)
    await delay(400)
    // In the browser demo, RAWG supports CORS so a user-provided key works too.
    const settings = await api.GetSettings()
    const key = settings['rawg_api_key']
    if (!key) return empty()
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(title)}&page_size=1`
      )
      if (!res.ok) return empty()
      const data = await res.json()
      const r = data?.results?.[0]
      if (!r) return empty()
      return {
        title: r.name || title,
        coverUrl: r.background_image || '',
        rating: r.rating || 0,
        metacritic: r.metacritic || 0,
        released: r.released || '',
        rawgId: r.id || 0,
        genres: (r.genres || []).map((g: any) => g.name),
      }
    } catch {
      return empty()
    }
  },

  // ---------- STEAM ----------

  async FetchSteamLibrary(apiKey: string, steamId: string): Promise<SteamGame[]> {
    if (isDesktopApp()) return WailsFetchSteamLibrary(apiKey, steamId)
    await delay(400)
    // Steam's Web API does not send CORS headers, so browser fetch is blocked.
    throw new Error('Steam import is available in the desktop app only.')
  },

  async AddSteamGames(games: SteamGame[]): Promise<number> {
    if (isDesktopApp()) return WailsAddSteamGames(games)
    await delay(300)
    let added = 0
    for (const g of games) {
      if (demoGames.some((dg) => dg.title === g.title)) continue
      const id = 'g' + Math.random().toString(36).slice(2, 8)
      demoGames.push({
        id,
        title: g.title,
        coverArt: g.coverUrl,
        totalPlaytime: g.playtimeHours,
        steamAppId: g.appId,
      })
      demoAlts[id] = []
      added++
    }
    return added
  },
}
