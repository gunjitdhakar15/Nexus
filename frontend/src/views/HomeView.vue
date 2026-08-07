<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGames } from '@/stores/games'
import { useUI, demoNotice } from '@/stores/ui'
import { useSettings } from '@/stores/settings'
import { getGameIcon } from '@/utils/gameIcons'
import { api, type Game, type SteamGame } from '@/services/api'
import { isDesktopDemo } from '@/utils/env'

const router = useRouter()
const gamesStore = useGames()
const { isDarkMode, toggleTheme, showMenu } = useUI()
const { steamApiKey, steamId, loadSettings } = useSettings()

const { games, loading, altPreviews, totalAlts, totalPlaytime, mostPlayedGame, recentGames, addGame, importSteamGames } = gamesStore

const showAddGameModal = ref(false)
const newGameTitle = ref('')
const searchQuery = ref('')
const selectedCategory = ref('Popular')

const showSteamModal = ref(false)
const steamFetching = ref(false)
const steamImporting = ref(false)
const steamResults = ref<SteamGame[]>([])
const steamSelected = ref<Set<string>>(new Set())
const steamError = ref('')
const steamNotice = ref('')

const filteredGames = computed(() => {
  let result = games.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((g) => g.title.toLowerCase().includes(q))
  }
  if (selectedCategory.value === 'Most Played') {
    result = result.sort((a, b) => b.totalPlaytime - a.totalPlaytime).slice(0, 5)
  }
  if (selectedCategory.value === 'Recent') {
    result = result.slice(0, 4)
  }
  if (selectedCategory.value === 'Popular') {
    result = result.sort((a, b) => b.totalPlaytime - a.totalPlaytime)
  }
  return result
})

const selectGame = (game: Game) => {
  router.push({ name: 'game-detail', params: { id: game.id } })
}

const handleAddGame = async () => {
  const title = newGameTitle.value.trim()
  if (!title) return
  const ok = await addGame(title)
  if (ok) {
    newGameTitle.value = ''
    showAddGameModal.value = false
  }
}

const openSteamModal = async () => {
  steamError.value = ''
  steamNotice.value = ''
  steamResults.value = []
  steamSelected.value = new Set()
  if (isDesktopDemo()) {
    steamNotice.value = 'Steam import works in the desktop app. Download it from the link above.'
  }
  if (steamApiKey.value === '' && steamId.value === '') {
    await loadSettings()
  }
  showSteamModal.value = true
}

const fetchSteamGames = async () => {
  if (!steamApiKey.value || !steamId.value) {
    steamError.value = 'Enter both your Steam API key and Steam ID first.'
    return
  }
  steamFetching.value = true
  steamError.value = ''
  steamResults.value = []
  steamSelected.value = new Set()
  try {
    const games = await api.FetchSteamLibrary(steamApiKey.value.trim(), steamId.value.trim())
    steamResults.value = games
    if (games.length > 0) {
      steamResults.value.forEach((g) => steamSelected.value.add(g.appId.toString()))
    }
  } catch (err: any) {
    steamError.value = err.message || 'Failed to fetch Steam library'
  } finally {
    steamFetching.value = false
  }
}

const toggleSteamGame = (appId: number) => {
  const key = appId.toString()
  if (steamSelected.value.has(key)) steamSelected.value.delete(key)
  else steamSelected.value.add(key)
}

const handleSteamImport = async () => {
  const selected = steamResults.value.filter((g) => steamSelected.value.has(g.appId.toString()))
  if (selected.length === 0) return
  steamImporting.value = true
  steamError.value = ''
  try {
    const added = await importSteamGames(selected)
    showSteamModal.value = false
    if (added === 0) {
      alert('All selected games are already in your library.')
    }
  } catch (err: any) {
    steamError.value = err.message || 'Failed to import games'
  } finally {
    steamImporting.value = false
  }
}

onMounted(() => {
  if (games.value.length === 0) {
    gamesStore.loadGames()
  }
  loadSettings()
})
</script>

<template>
  <div class="app-layout">
    <!-- ========== LEFT SIDEBAR ========== -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon"><i class="fas fa-rocket"></i></span>
      </div>

      <nav class="sidebar-nav">
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'Popular' }"
          @click="selectedCategory = 'Popular'"
          title="Popular"
        >
          <i class="fas fa-fire nav-icon"></i>
        </div>
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'New Games' }"
          @click="selectedCategory = 'New Games'"
          title="New Games"
        >
          <i class="fas fa-star nav-icon"></i>
        </div>
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'Most Played' }"
          @click="selectedCategory = 'Most Played'"
          title="Most Played"
        >
          <i class="fas fa-trophy nav-icon"></i>
        </div>
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'Recent' }"
          @click="selectedCategory = 'Recent'"
          title="Recent"
        >
          <i class="fas fa-clock nav-icon"></i>
        </div>
        <div class="nav-item" @click="showAddGameModal = true" title="Add Game">
          <i class="fas fa-plus nav-icon"></i>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-stat" title="Games">
          <span class="stat-number">{{ games.length }}</span>
          <i class="fas fa-gamepad stat-icon"></i>
        </div>
        <div class="sidebar-stat" title="Alts">
          <span class="stat-number">{{ totalAlts }}</span>
          <i class="fas fa-users stat-icon"></i>
        </div>
        <div class="sidebar-stat" title="Playtime">
          <span class="stat-number">{{ totalPlaytime }}h</span>
          <i class="fas fa-hourglass-half stat-icon"></i>
        </div>
      </div>
    </aside>

    <!-- ========== MAIN CONTENT ========== -->
    <main class="main-content">
      <!-- DEMO BANNER -->
      <div class="demo-banner">
        <i class="fas fa-flask"></i>
        Demo preview — sample data, changes reset on reload.
        <a href="https://github.com/gunjitdhakar15/Nexus/releases/latest" target="_blank" rel="noopener">Get the desktop app</a>
      </div>

      <!-- HEADER -->
      <header class="main-header">
        <div class="header-left">
          <div class="greeting">
            <span class="greeting-text">Good evening,</span>
            <span class="greeting-name">Gunjit</span>
          </div>
          <div class="search-bar">
            <i class="fas fa-search search-icon"></i>
            <input
              v-model="searchQuery"
              placeholder="Search games..."
              class="search-input"
            />
          </div>
        </div>
        <div class="header-right">
          <button class="theme-toggle" @click="toggleTheme" :title="isDarkMode ? 'Switch to Light' : 'Switch to Dark'">
            <i :class="isDarkMode ? 'fas fa-moon' : 'fas fa-sun'"></i>
          </button>
          <div class="profile-icon" @click="showMenu = !showMenu" title="Profile">
            <i class="fas fa-user-circle avatar"></i>
          </div>
        </div>
      </header>

      <!-- ========== CATEGORY TABS ========== -->
      <div class="category-tabs">
        <span
          v-for="cat in ['Popular', 'New Games', 'Most Played', 'Recent']"
          :key="cat"
          class="category-tab"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </span>
        <span class="category-tab see-more" @click="showAddGameModal = true">
          + Add Game
        </span>
        <span class="category-tab see-more steam-tab" @click="openSteamModal">
          <i class="fab fa-steam"></i> Import from Steam
        </span>
      </div>

      <!-- ========== GAME GRID ========== -->
      <div v-if="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>

      <div v-else>
        <div class="game-grid">
          <div
            v-for="game in filteredGames"
            :key="game.id"
            class="game-card"
            @click="selectGame(game)"
          >
            <div
              class="game-card-glass"
              :class="{ 'has-cover': game.coverArt }"
              :style="game.coverArt ? { backgroundImage: 'url(' + game.coverArt + ')' } : {}"
            >
              <div class="game-card-content">
                <div class="game-card-top">
                  <div class="game-card-header">
                    <i :class="['fas', getGameIcon(game.title), 'game-icon']"></i>
                    <span class="game-status">
                      <i class="fas fa-circle" style="color:#4ade80;font-size:8px;margin-right:4px;"></i>
                      Play
                    </span>
                  </div>
                  <h3 class="game-title">{{ game.title }}</h3>
                  <div class="game-meta">
                    <span><i class="fas fa-clock"></i> {{ game.totalPlaytime }}h</span>
                    <span><i class="fas fa-user-friends"></i> {{ altPreviews[game.id]?.length || 0 }} alts</span>
                  </div>
                  <div class="game-meta" v-if="game.rating || game.metacritic">
                    <span v-if="game.rating" class="meta-rating"><i class="fas fa-star"></i> {{ game.rating.toFixed(1) }}</span>
                    <span v-if="game.metacritic" class="meta-meta"><i class="fas fa-crown"></i> {{ game.metacritic }}</span>
                    <span v-if="game.released" class="meta-release"><i class="fas fa-calendar"></i> {{ game.released.slice(0, 4) }}</span>
                  </div>
                </div>
                <div class="game-card-bottom">
                  <span class="game-edition">Open Game</span>
                  <span class="game-reviews"><i class="fas fa-arrow-right"></i> View alts</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Game Card -->
          <div class="game-card add-game-card" @click="showAddGameModal = true">
            <div class="game-card-glass add-game-glass">
              <div class="game-card-content add-game-content">
                <i class="fas fa-plus-circle add-icon"></i>
                <h3 class="add-title">Add New Game</h3>
                <p class="add-sub">Click to add</p>
              </div>
            </div>
          </div>
        </div>

        <!-- See More Link -->
        <div class="see-more-section">
          <span class="see-more-link" @click="selectedCategory = 'Most Played'">
            See More <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </main>

    <!-- ========== RIGHT PANEL ========== -->
    <aside class="right-panel">
      <div class="panel-section">
        <h3 class="panel-title"><i class="fas fa-chart-simple"></i> Your Statistics</h3>
        <div class="total-hours">
          <span class="total-hours-value">{{ totalPlaytime }}h</span>
          <span class="total-hours-label">Total Hours</span>
        </div>
        <div class="stats-grid">
          <div class="panel-stat">
            <span class="panel-stat-value">{{ games.length }}</span>
            <span class="panel-stat-label">Games</span>
          </div>
          <div class="panel-stat">
            <span class="panel-stat-value">{{ totalAlts }}</span>
            <span class="panel-stat-label">Alts</span>
          </div>
        </div>
      </div>

      <div class="panel-section" v-if="recentGames.length > 0">
        <h3 class="panel-title"><i class="fas fa-clock-rotate-left"></i> Last Downloads</h3>
        <div class="panel-game-card" v-for="game in recentGames" :key="game.id">
          <div class="panel-game-info">
            <i :class="['fas', getGameIcon(game.title), 'panel-game-icon']"></i>
            <div>
              <div class="panel-game-name">{{ game.title }}</div>
              <div class="panel-game-hours">{{ game.totalPlaytime }}h total</div>
              <div class="panel-download-progress">
                <div class="progress-bar" :style="{ width: Math.min((game.totalPlaytime / 100) * 100, 100) + '%' }"></div>
                <span class="progress-text">{{ Math.min(Math.round((game.totalPlaytime / 100) * 100), 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-section" v-if="mostPlayedGame">
        <h3 class="panel-title"><i class="fas fa-trophy"></i> Most Played</h3>
        <div class="panel-game-card highlight">
          <div class="panel-game-info">
            <i :class="['fas', getGameIcon(mostPlayedGame.title), 'panel-game-icon']"></i>
            <div>
              <div class="panel-game-name">{{ mostPlayedGame.title }}</div>
              <div class="panel-game-hours">{{ mostPlayedGame.totalPlaytime }} hours</div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ========== ADD GAME MODAL ========== -->
    <div v-if="showAddGameModal" class="modal-overlay" @click="showAddGameModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Add New Game</h3>
          <button class="modal-close" @click="showAddGameModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class="fas fa-gamepad"></i> Game Name</label>
            <input
              v-model="newGameTitle"
              placeholder="e.g., Elden Ring, Valorant, WoW"
              @keyup.enter="handleAddGame"
              autofocus
            />
          </div>
          <div class="form-group">
            <label><i class="fas fa-image"></i> Cover Art (optional)</label>
            <div class="file-upload">
              <button class="file-upload-btn" @click="demoNotice('File upload')"><i class="fas fa-folder-open"></i> Choose File</button>
              <span class="file-upload-text">No file chosen</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showAddGameModal = false">Cancel</button>
          <button class="modal-confirm" @click="handleAddGame">
            <i class="fas fa-plus"></i> Add Game
          </button>
        </div>
      </div>
    </div>

    <!-- ========== STEAM IMPORT MODAL ========== -->
    <div v-if="showSteamModal" class="modal-overlay" @click="showSteamModal = false">
      <div class="modal-content steam-modal" @click.stop>
        <div class="modal-header">
          <h3><i class="fab fa-steam"></i> Import from Steam</h3>
          <button class="modal-close" @click="showSteamModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div v-if="steamNotice" class="steam-notice">
            <i class="fas fa-flask"></i> {{ steamNotice }}
          </div>

          <div v-if="steamResults.length === 0">
            <div class="form-group">
              <label>Steam Web API Key</label>
              <input
                v-model="steamApiKey"
                placeholder="e.g. ABCDEF1234567890ABCDEF1234567890"
              />
            </div>
            <div class="form-group">
              <label>Steam ID (17-digit profile ID)</label>
              <input
                v-model="steamId"
                placeholder="e.g. 76561198000000000"
                @keyup.enter="fetchSteamGames"
              />
            </div>
            <div class="steam-hint">
              <i class="fas fa-info-circle"></i> Get both from
              <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener">steamcommunity.com/dev/apikey</a>
            </div>
          </div>

          <div v-if="steamResults.length > 0" class="steam-results">
            <div class="steam-count">
              <i class="fas fa-check-circle"></i> {{ steamSelected.size }} of {{ steamResults.length }} games selected
            </div>
            <div class="steam-list">
              <label
                v-for="g in steamResults"
                :key="g.appId"
                class="steam-item"
                :class="{ checked: steamSelected.has(g.appId.toString()) }"
              >
                <input
                  type="checkbox"
                  :checked="steamSelected.has(g.appId.toString())"
                  @change="toggleSteamGame(g.appId)"
                />
                <img v-if="g.coverUrl" :src="g.coverUrl" class="steam-thumb" alt="" />
                <i v-else class="fas fa-gamepad steam-thumb steam-thumb-icon"></i>
                <span class="steam-item-name">{{ g.title }}</span>
                <span class="steam-item-hours">{{ g.playtimeHours }}h</span>
              </label>
            </div>
          </div>

          <div v-if="steamError" class="steam-error">
            <i class="fas fa-exclamation-circle"></i> {{ steamError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showSteamModal = false">Cancel</button>
          <button
            v-if="steamResults.length === 0"
            class="modal-confirm"
            @click="fetchSteamGames"
            :disabled="steamFetching"
          >
            <i class="fas" :class="steamFetching ? 'fa-spinner fa-spin' : 'fa-download'"></i>
            {{ steamFetching ? 'Fetching...' : 'Fetch Games' }}
          </button>
          <button
            v-else
            class="modal-confirm"
            @click="handleSteamImport"
            :disabled="steamImporting || steamSelected.size === 0"
          >
            <i class="fas" :class="steamImporting ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
            {{ steamImporting ? 'Importing...' : 'Import Selected' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== COVER ART CARDS ========== */
.game-card-glass.has-cover {
  background-size: cover;
  background-position: center;
  position: relative;
}

.game-card-glass.has-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(5, 8, 15, 0.15) 0%, rgba(5, 8, 15, 0.55) 55%, rgba(5, 8, 15, 0.92) 100%);
}

.game-card-glass.has-cover .game-card-content {
  position: relative;
  z-index: 1;
}

.game-card-glass.has-cover .game-card-header .game-icon {
  opacity: 0;
}

.game-card-glass.has-cover .game-title {
  font-size: 20px;
}

/* ========== META BADGES ========== */
.meta-rating i {
  color: #facc15;
}

.meta-meta i {
  color: var(--gradient-start);
}

.meta-release i {
  color: var(--text-dim);
}

/* ========== STEAM TAB ========== */
.steam-tab {
  color: #66c0f4;
}

.steam-tab:hover {
  border-color: #66c0f4;
  color: #66c0f4;
}

/* ========== STEAM MODAL ========== */
.steam-modal {
  width: 520px;
}

.steam-notice {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(108, 140, 255, 0.1);
  border: 1px solid rgba(108, 140, 255, 0.25);
  color: var(--text-secondary);
  font-size: 13px;
}

.steam-hint {
  font-size: 12px;
  color: var(--text-dim);
}

.steam-hint a {
  color: var(--gradient-start);
  text-decoration: none;
}

.steam-hint a:hover {
  text-decoration: underline;
}

.steam-results {
  margin-top: 8px;
}

.steam-count {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.steam-count i {
  color: #4ade80;
}

.steam-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.steam-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-glass);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.steam-item:hover {
  border-color: var(--border-light);
}

.steam-item.checked {
  border-color: rgba(108, 140, 255, 0.4);
  background: rgba(108, 140, 255, 0.08);
}

.steam-item input[type='checkbox'] {
  accent-color: var(--gradient-start);
  flex-shrink: 0;
}

.steam-thumb {
  width: 46px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.steam-thumb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-dim);
  font-size: 12px;
}

.steam-item-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.steam-item-hours {
  font-size: 12px;
  color: var(--text-dim);
  white-space: nowrap;
}

.steam-error {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 13px;
}
</style>
