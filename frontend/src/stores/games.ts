import { ref, computed } from 'vue'
import { api, type Game, type AltAccount, type SteamGame } from '../services/api'

const games = ref<Game[]>([])
const loading = ref(false)
const altPreviews = ref<Record<string, AltAccount[]>>({})

const totalAlts = computed(() => {
  let count = 0
  for (const key in altPreviews.value) {
    count += altPreviews.value[key].length
  }
  return count
})

const totalPlaytime = computed(() =>
  games.value.reduce((total, g) => total + g.totalPlaytime, 0)
)

const mostPlayedGame = computed(() => {
  if (games.value.length === 0) return null
  return games.value.reduce((a, b) => (a.totalPlaytime > b.totalPlaytime ? a : b))
})

const recentGames = computed(() => games.value.slice(0, 3))

const loadGames = async () => {
  loading.value = true
  try {
    const result = await api.GetAllGames()
    games.value = result

    for (const game of result) {
      await loadAltPreview(game.id)
    }
  } catch (err: any) {
    console.error('Error loading games:', err)
    alert('Error loading games: ' + err.message)
  } finally {
    loading.value = false
  }
}

const loadAltPreview = async (gameId: string) => {
  try {
    const result = await api.GetAltsByGame(gameId)
    altPreviews.value[gameId] = result.slice(0, 3)
  } catch (err) {
    console.error('Error loading alt preview:', err)
    altPreviews.value[gameId] = []
  }
}

const addGame = async (title: string): Promise<boolean> => {
  try {
    // If a RAWG key is configured, auto-fetch cover art + metadata first.
    const settings = await api.GetSettings()
    if (settings['rawg_api_key']) {
      try {
        const details = await api.FetchGameArtwork(title)
        if (details.coverUrl || details.rawgId) {
          await api.AddGameWithDetails(
            details.title || title,
            details.coverUrl,
            details.metacritic,
            details.rating,
            details.released,
            details.genres.join(', '),
            details.rawgId,
            0
          )
          await loadGames()
          return true
        }
      } catch (err) {
        console.warn('RAWG enrichment failed, adding without cover:', err)
      }
    }
    await api.AddGame(title, '')
    await loadGames()
    return true
  } catch (err: any) {
    console.error('Error adding game:', err)
    alert('Error adding game: ' + err.message)
    return false
  }
}

const importSteamGames = async (games: SteamGame[]): Promise<number> => {
  const added = await api.AddSteamGames(games)
  if (added > 0) await loadGames()
  return added
}

export function useGames() {
  return {
    games,
    loading,
    altPreviews,
    totalAlts,
    totalPlaytime,
    mostPlayedGame,
    recentGames,
    loadGames,
    loadAltPreview,
    addGame,
    importSteamGames,
  }
}
