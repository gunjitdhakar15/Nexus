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
const {
  isDarkMode,
  toggleTheme,
  showMenu,
  showCartModal,
  showNotificationsModal,
  showChatModal,
  activeFriend,
  showToast,
} = useUI()
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

const launchGame = (title: string) => {
  showToast(`🚀 Launching ${title} alt account...`)
}

const openChat = (name: string) => {
  activeFriend.value = name
  showChatModal.value = true
}

const featuredGame = computed(() => {
  return games.value.find(g => g.title.toLowerCase().includes('valorant')) || games.value[0] || null
})

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
        <span class="brand-icon"><i class="fas fa-shield-halved"></i></span>
      </div>

      <nav class="sidebar-nav">
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'Popular' }"
          @click="selectedCategory = 'Popular'"
          title="Home / Popular"
        >
          <i class="fas fa-house nav-icon"></i>
        </div>
        <div
          class="nav-item"
          :class="{ active: selectedCategory === 'New Games' }"
          @click="selectedCategory = 'New Games'"
          title="Games"
        >
          <i class="fas fa-gamepad nav-icon"></i>
        </div>
        <div
          class="nav-item"
          @click="openSteamModal"
          title="Steam Import"
        >
          <i class="fab fa-steam nav-icon"></i>
        </div>
        <div
          class="nav-item"
          @click="showAddGameModal = true"
          title="Add Game"
        >
          <i class="fas fa-plus nav-icon"></i>
        </div>
        <div
          class="nav-item"
          @click="toggleTheme"
          :title="isDarkMode ? 'Light Mode' : 'Dark Mode'"
        >
          <i :class="isDarkMode ? 'fas fa-moon' : 'fas fa-sun'" class="nav-icon"></i>
        </div>
        <div
          class="nav-item"
          @click="router.push({ name: 'settings' })"
          title="Settings"
        >
          <i class="fas fa-gear nav-icon"></i>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="add-box-btn" @click="showAddGameModal = true" title="Add New Game">
          <i class="fas fa-plus"></i>
        </div>
      </div>
    </aside>

    <!-- ========== MAIN CONTENT ========== -->
    <main class="main-content">
      <!-- DEMO BANNER -->
      <div class="demo-banner">
        <i class="fas fa-flask"></i>
        Nexus Launcher — Manage all your game alts, playtime & accounts in one place.
        <a href="https://github.com/gunjitdhakar15/Nexus/releases/latest" target="_blank" rel="noopener">Get Desktop App</a>
      </div>

      <!-- HEADER -->
      <header class="main-header">
        <div class="header-left">
          <div class="greeting">
            <span class="greeting-name">Good evening, Gunjit</span>
          </div>
        </div>
        <div class="search-bar">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchQuery"
            placeholder="Search games..."
            class="search-input"
          />
        </div>
        <div class="header-right">
          <button class="header-action-btn" @click="showCartModal = true" title="Store & DLCs"><i class="fas fa-shopping-bag"></i></button>
          <button class="header-action-btn" @click="showNotificationsModal = true" title="Notifications"><i class="fas fa-bell"></i></button>
          <div class="profile-icon" @click="showMenu = !showMenu" title="Profile">
            <i class="fas fa-user-circle avatar"></i>
          </div>
        </div>
      </header>

      <!-- ========== HERO FEATURED SECTION ========== -->
      <div class="hero-section" v-if="featuredGame">
        <div class="hero-banner">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <div class="hero-tags">
              <span class="hero-tag-popular"><i class="fas fa-fire"></i> Popular</span>
              <span class="hero-tag-platform"><i class="fab fa-steam"></i></span>
              <span class="hero-tag-platform"><i class="fas fa-shield-cat"></i></span>
            </div>
            <h1 class="hero-title">{{ featuredGame.title }}</h1>
            <p class="hero-desc">
              {{ featuredGame.title }} is a competitive tactical shooter with custom alt account tracking, real-time playtime sync and match stats.
            </p>
            <div class="hero-actions">
              <div class="review-avatars">
                <span class="avatar-mini bg1"><i class="fas fa-user"></i></span>
                <span class="avatar-mini bg2"><i class="fas fa-user-ninja"></i></span>
                <span class="avatar-mini bg3"><i class="fas fa-mask"></i></span>
              </div>
              <button class="hero-btn-reviews" @click="selectGame(featuredGame)">
                <i class="fas fa-thumbs-up"></i> {{ altPreviews[featuredGame.id]?.length || 3 }} Alts & Reviews
              </button>
            </div>
          </div>
          <div class="hero-character">
            <i :class="['fas', getGameIcon(featuredGame.title), 'hero-bg-icon']"></i>
          </div>
        </div>

        <!-- QUICK ACCESS STACK -->
        <div class="hero-stack">
          <div
            v-for="game in games.slice(1, 4)"
            :key="game.id"
            class="stack-card"
            @click="selectGame(game)"
          >
            <div class="stack-thumb">
              <i :class="['fas', getGameIcon(game.title)]"></i>
            </div>
            <div class="stack-info">
              <div class="stack-title">{{ game.title }}</div>
              <div class="stack-sub">{{ game.totalPlaytime }}h played • {{ altPreviews[game.id]?.length || 1 }} alts</div>
            </div>
            <i class="fas fa-chevron-right stack-arrow"></i>
          </div>
        </div>
      </div>

      <!-- ========== CATEGORY TABS & ROW ========== -->
      <div class="section-header">
        <h2 class="section-title">Library Games</h2>
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
            <i class="fab fa-steam"></i> Import Steam
          </span>
        </div>
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
                    <button class="game-play-badge" @click.stop="launchGame(game.title)"><i class="fas fa-play"></i></button>
                  </div>
                  <h3 class="game-title">{{ game.title }}</h3>
                  <p class="game-subtitle">{{ game.genres || 'Action, Multiplayer' }}</p>
                  <div class="game-meta">
                    <span><i class="fas fa-clock"></i> {{ game.totalPlaytime }}h</span>
                    <span><i class="fas fa-users"></i> {{ altPreviews[game.id]?.length || 0 }} alts</span>
                  </div>
                </div>
                <div class="game-card-bottom">
                  <span class="game-edition">Open Game</span>
                  <span class="game-reviews"><i class="fas fa-arrow-right"></i></span>
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
                <p class="add-sub">Click to tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== LAST DOWNLOADS / ACTIVE SESSION BAR ========== -->
      <div class="downloads-section" v-if="recentGames.length > 0">
        <div class="section-header">
          <h2 class="section-title">Active Downloads & Session</h2>
          <span class="see-more-link" @click="selectedCategory = 'Recent'">See More <i class="fas fa-arrow-right"></i></span>
        </div>
        <div class="download-card">
          <div class="download-left">
            <div class="download-thumb">
              <i :class="['fas', getGameIcon(recentGames[0]?.title || 'FIFA')]"></i>
            </div>
            <div class="download-info">
              <h4 class="download-title">{{ recentGames[0]?.title || 'FIFA 23' }}</h4>
              <span class="download-tag">Alt Account Active</span>
            </div>
          </div>
          <div class="download-center">
            <span class="download-time">1 hour 23 min.</span>
            <span class="download-size">265Mb of 1.23Gb</span>
          </div>
          <div class="download-actions">
            <button class="download-btn play" @click.stop="launchGame(recentGames[0]?.title || 'FIFA')" title="Play"><i class="fas fa-play"></i></button>
            <button class="download-btn cancel" @click.stop="showToast('Session paused')" title="Pause"><i class="fas fa-times"></i></button>
          </div>
        </div>
      </div>
    </main>

    <!-- ========== RIGHT STATISTICS PANEL ========== -->
    <aside class="right-panel">
      <div class="panel-section">
        <div class="panel-header-row">
          <h3 class="panel-title">Your Statistic</h3>
          <i class="fas fa-arrow-right panel-arrow"></i>
        </div>

        <!-- ORGANIC WAVE GLOW ORB -->
        <div class="orb-container">
          <div class="wave-orb">
            <div class="orb-content">
              <span class="orb-label">Total hours</span>
              <span class="orb-value">{{ totalPlaytime.toLocaleString() }}h</span>
            </div>
          </div>
        </div>

        <!-- TOP GAME HOURS BADGES -->
        <div class="top-games-row">
          <div class="top-game-badge" v-for="g in games.slice(0, 3)" :key="g.id">
            <div class="badge-icon">
              <i :class="['fas', getGameIcon(g.title)]"></i>
            </div>
            <span class="badge-hours">{{ g.totalPlaytime }}h</span>
          </div>
        </div>
      </div>

      <div class="panel-section" v-if="mostPlayedGame">
        <h3 class="panel-title"><i class="fas fa-trophy"></i> Most Played</h3>
        <div class="panel-game-card highlight" @click="selectGame(mostPlayedGame)">
          <div class="panel-game-info">
            <i :class="['fas', getGameIcon(mostPlayedGame.title), 'panel-game-icon']"></i>
            <div>
              <div class="panel-game-name">{{ mostPlayedGame.title }}</div>
              <div class="panel-game-hours">{{ mostPlayedGame.totalPlaytime }} hours total</div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ========== RIGHTMOST FRIENDS / SOCIAL BAR ========== -->
    <aside class="social-bar">
      <div class="friend-item" @click="openChat('Nikitin')" title="Nikitin (In Game)">
        <div class="friend-avatar bg-a">
          <i class="fas fa-user-ninja"></i>
          <span class="status-dot online"></span>
        </div>
        <span class="friend-tag">In Game</span>
      </div>
      <div class="friend-item" v-for="i in 5" :key="i" @click="openChat('Friend #' + i)" :title="'Friend #' + i">
        <div class="friend-avatar" :class="'bg-' + (i % 4)">
          <i class="fas" :class="['fa-user-astronaut', 'fa-user-secret', 'fa-user-graduate', 'fa-user-shield'][i % 4]"></i>
          <span class="status-dot" :class="i % 2 === 0 ? 'online' : 'away'"></span>
        </div>
      </div>
      <div class="social-footer">
        <button class="social-btn" @click="openChat('Community Chat')" title="Chat"><i class="fas fa-comment"></i></button>
        <button class="social-btn" @click="showToast('Party voice connected')" title="Party"><i class="fas fa-user-group"></i></button>
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
/* ========== HEADER & SEARCH ========== */
.greeting-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.search-bar {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 24px;
  padding: 8px 18px;
  border: 1px solid var(--border-color);
  flex: 1;
  max-width: 380px;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--accent-coral);
}

.search-icon {
  color: var(--text-dim);
  font-size: 14px;
  margin-right: 10px;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  width: 100%;
}

.header-action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.header-action-btn:hover {
  border-color: var(--accent-coral);
  color: var(--text-primary);
}

/* ========== HERO FEATURED SECTION ========== */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  margin-bottom: 28px;
}

.hero-banner {
  position: relative;
  border-radius: 28px;
  padding: 28px;
  background: linear-gradient(135deg, #e5384b 0%, #a82433 40%, #401520 100%);
  overflow: hidden;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 12px 32px rgba(229, 56, 75, 0.25);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.15), transparent 70%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 65%;
}

.hero-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.hero-tag-popular {
  background: var(--accent-cream);
  color: var(--accent-cream-text);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hero-tag-platform {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.hero-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0 0 18px 0;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-avatars {
  display: flex;
  align-items: center;
}

.avatar-mini {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #a82433;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  margin-left: -8px;
}

.avatar-mini:first-child { margin-left: 0; }
.avatar-mini.bg1 { background: #3b82f6; }
.avatar-mini.bg2 { background: #10b981; }
.avatar-mini.bg3 { background: #f59e0b; }

.hero-btn-reviews {
  background: rgba(255, 255, 255, 0.95);
  color: #230e15;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.hero-btn-reviews:hover {
  transform: scale(1.04);
}

.hero-character {
  position: absolute;
  right: -10px;
  bottom: -20px;
  z-index: 1;
  opacity: 0.35;
  pointer-events: none;
}

.hero-bg-icon {
  font-size: 180px;
  color: #ffffff;
}

/* ========== QUICK ACCESS STACK ========== */
.hero-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stack-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.stack-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-light);
  transform: translateX(4px);
}

.stack-thumb {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(229, 56, 75, 0.2);
  color: var(--accent-coral);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.stack-info {
  flex: 1;
  overflow: hidden;
}

.stack-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stack-sub {
  font-size: 11px;
  color: var(--text-dim);
}

.stack-arrow {
  font-size: 12px;
  color: var(--text-dim);
}

/* ========== SECTION HEADERS ========== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* ========== GAME CARD OVERRIDES ========== */
.game-play-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-coral);
  border: none;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(229, 56, 75, 0.4);
}

.game-subtitle {
  font-size: 12px;
  color: var(--text-dim);
  margin: 0 0 12px 0;
}

.game-card-glass.has-cover {
  background-size: cover;
  background-position: center;
  position: relative;
}

.game-card-glass.has-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(35, 14, 21, 0.2) 0%, rgba(35, 14, 21, 0.85) 100%);
}

.game-card-glass.has-cover .game-card-content {
  position: relative;
  z-index: 1;
}

/* ========== DOWNLOADS BAR ========== */
.downloads-section {
  margin-top: 28px;
}

.download-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  background: rgba(229, 56, 75, 0.15);
  border: 1px solid rgba(229, 56, 75, 0.3);
  border-radius: 24px;
}

.download-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.download-thumb {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #230e15;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.download-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.download-tag {
  font-size: 11px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
  padding: 2px 10px;
  border-radius: 10px;
}

.download-center {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.download-time {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.download-size {
  font-size: 11px;
  color: var(--text-dim);
}

.download-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.download-btn.play {
  background: #ffffff;
  color: var(--accent-coral);
}

.download-btn.cancel {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* ========== RIGHT STATS ORB WIDGET ========== */
.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-arrow {
  color: var(--text-dim);
  font-size: 14px;
}

.orb-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 20px 0;
}

.wave-orb {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff6b81 0%, #e5384b 40%, #701828 75%, transparent 100%);
  box-shadow: 0 0 45px rgba(229, 56, 75, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulseOrb 4s infinite alternate ease-in-out;
}

@keyframes pulseOrb {
  0% { transform: scale(0.98); box-shadow: 0 0 35px rgba(229, 56, 75, 0.3); }
  100% { transform: scale(1.03); box-shadow: 0 0 55px rgba(255, 107, 129, 0.5); }
}

.orb-content {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #1f0b12;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.orb-label {
  font-size: 11px;
  color: var(--text-dim);
}

.orb-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.top-games-row {
  display: flex;
  justify-content: space-around;
  margin-top: 14px;
}

.top-game-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.badge-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #230e15;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.badge-hours {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

/* ========== RIGHTMOST SOCIAL BAR ========== */
.social-bar {
  width: 68px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(var(--glass-blur));
  border-left: 1px solid var(--border-color);
  padding: 20px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.friend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.friend-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #391823;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  position: relative;
  border: 1px solid var(--border-light);
}

.friend-avatar.bg-a { background: #e5384b; }
.friend-avatar.bg-0 { background: #3b82f6; }
.friend-avatar.bg-1 { background: #10b981; }
.friend-avatar.bg-2 { background: #8b5cf6; }
.friend-avatar.bg-3 { background: #f59e0b; }

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  right: -2px;
  border: 2px solid #230e15;
}

.status-dot.online { background: #4ade80; }
.status-dot.away { background: #facc15; }

.friend-tag {
  font-size: 9px;
  color: var(--accent-coral);
  font-weight: 700;
  white-space: nowrap;
}

.social-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.social-btn:hover {
  background: var(--accent-coral);
  color: #fff;
  border-color: var(--accent-coral);
}

.add-box-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-box-btn:hover {
  border-color: var(--accent-coral);
  color: var(--accent-coral);
}

/* ========== RESPONSIVE MEDIA QUERIES ========== */
@media (max-width: 1200px) {
  .social-bar {
    display: none !important;
  }
}

@media (max-width: 992px) {
  .hero-section {
    grid-template-columns: 1fr;
  }
  .right-panel {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 60px;
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 16px;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
  .sidebar-nav {
    flex-direction: row;
  }
  .sidebar-footer {
    display: none;
  }
  .main-content {
    padding: 16px;
  }
  .hero-banner {
    padding: 20px;
  }
  .hero-title {
    font-size: 24px;
  }
}
</style>
