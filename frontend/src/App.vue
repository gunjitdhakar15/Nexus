<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GetAllGames, AddGame, GetAltsByGame, AddAlt, UpdateAlt, DeleteAlt } from '../wailsjs/go/main/App'
import AddAltModal from '@/components/modals/AddAltModal.vue'
import AltCard from '@/components/details/AltCard.vue'

interface Game {
  id: string
  title: string
  coverArt: string
  totalPlaytime: number
}

interface AltAccount {
  id: string
  gameId: string
  name: string
  level: number
  playtimeHours: number
  lastPlayed: string
  progress: Record<string, any>
}

// ========== THEME ==========
const isDarkMode = ref(true)

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
}

// ========== STATE ==========
const games = ref<Game[]>([])
const loading = ref(false)
const showAddGameModal = ref(false)
const newGameTitle = ref('')
const searchQuery = ref('')
const selectedCategory = ref('Popular')

// ========== ALT MODAL ==========
const showAddAltModal = ref(false)

// ========== NAVIGATION ==========
const selectedGame = ref<Game | null>(null)
const gameAlts = ref<AltAccount[]>([])
const showDetailView = ref(false)
const showMenu = ref(false)

// ========== ALT PREVIEW CACHE ==========
const altPreviews = ref<Record<string, AltAccount[]>>({})

// ========== COMPUTED ==========
const totalAlts = computed(() => {
  let count = 0
  for (const key in altPreviews.value) {
    count += altPreviews.value[key].length
  }
  return count
})

const totalPlaytime = computed(() => {
  let total = 0
  for (const game of games.value) {
    total += game.totalPlaytime
  }
  return total
})

const mostPlayedGame = computed(() => {
  if (games.value.length === 0) return null
  return games.value.reduce((a, b) => a.totalPlaytime > b.totalPlaytime ? a : b)
})

const recentGames = computed(() => {
  return games.value.slice(0, 3)
})

const filteredGames = computed(() => {
  let result = games.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(g => g.title.toLowerCase().includes(q))
  }
  if (selectedCategory.value === 'Most Played') {
    result = result.sort((a, b) => b.totalPlaytime - a.totalPlaytime).slice(0, 5)
  }
  if (selectedCategory.value === 'Recent') {
    result = result.slice(0, 4)
  }
  // For 'Popular' we just show all sorted by playtime
  if (selectedCategory.value === 'Popular') {
    result = result.sort((a, b) => b.totalPlaytime - a.totalPlaytime)
  }
  return result
})

// ========== GAME CRUD ==========
const loadGames = async () => {
  loading.value = true
  try {
    const result = await GetAllGames()
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
    const result = await GetAltsByGame(gameId)
    altPreviews.value[gameId] = result.slice(0, 3)
  } catch (err) {
    console.error('Error loading alt preview:', err)
    altPreviews.value[gameId] = []
  }
}

const handleAddGame = async () => {
  const title = newGameTitle.value.trim()
  if (!title) return
  
  try {
    await AddGame(title, '')
    newGameTitle.value = ''
    showAddGameModal.value = false
    await loadGames()
  } catch (err: any) {
    console.error('Error adding game:', err)
    alert('Error adding game: ' + err.message)
  }
}

// ========== NAVIGATION ==========
const selectGame = (game: Game) => {
  selectedGame.value = game
  showDetailView.value = true
  loadFullAlts(game.id)
}

const goBack = () => {
  showDetailView.value = false
  selectedGame.value = null
  gameAlts.value = []
}

const loadFullAlts = async (gameId: string) => {
  try {
    const result = await GetAltsByGame(gameId)
    gameAlts.value = result
  } catch (err) {
    console.error('Error loading full alts:', err)
  }
}

// ========== ALT MODAL HANDLERS ==========
const openAddAltModal = () => {
  showAddAltModal.value = true
}

const closeAddAltModal = () => {
  showAddAltModal.value = false
}

const handleAltAdded = async (newAlt: any) => {
  closeAddAltModal()
  await loadFullAlts(selectedGame.value!.id)
}

const handleAltUpdated = async (updatedAlt: any) => {
  const idx = gameAlts.value.findIndex(a => a.id === updatedAlt.id)
  if (idx !== -1) {
    gameAlts.value[idx] = updatedAlt
  }
  // Also update the preview
  const previewIdx = altPreviews.value[selectedGame.value!.id]?.findIndex(a => a.id === updatedAlt.id)
  if (previewIdx !== undefined && previewIdx >= 0) {
    altPreviews.value[selectedGame.value!.id][previewIdx] = updatedAlt
  }
}

const handleAltDeleted = async (altId: string) => {
  gameAlts.value = gameAlts.value.filter(a => a.id !== altId)
  altPreviews.value[selectedGame.value!.id] = altPreviews.value[selectedGame.value!.id]?.filter(a => a.id !== altId) || []
}

// ========== GAME IMAGES ==========
const getGameImage = (title: string): string => {
  const images: Record<string, string> = {
    'Valorant': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
    'Elden Ring': 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=400&fit=crop',
    'World of Warcraft': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=400&fit=crop',
    'Destiny 2': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop',
    'Counter-Strike': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
    'League of Legends': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
    'Subway Surf': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
    'Red Dead Redemption': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
    'Uncharted': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
    'FIFA': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
    'Dishonored': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
  }
  return images[title] || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=400&fit=crop'
}

const getGameBackground = (title: string): string => {
  const backgrounds: Record<string, string> = {
    'Valorant': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop',
    'Elden Ring': 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=1920&h=1080&fit=crop',
  }
  return backgrounds[title] || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1920&h=1080&fit=crop'
}

// Font Awesome icon mapping for games
const getGameIcon = (title: string): string => {
  const icons: Record<string, string> = {
    'Valorant': 'fa-crosshairs',
    'Elden Ring': 'fa-sword',
    'World of Warcraft': 'fa-dragon',
    'Destiny 2': 'fa-rocket',
    'Counter-Strike': 'fa-gun',
    'League of Legends': 'fa-crown',
    'Subway Surf': 'fa-train',
    'Red Dead Redemption': 'fa-horse-head',
    'Uncharted': 'fa-map',
    'FIFA': 'fa-futbol',
    'Dishonored': 'fa-mask',
  }
  return icons[title] || 'fa-gamepad'
}

// ========== HELPERS ==========
const showAlert = (msg: string) => alert(msg)

// ========== LIFECYCLE ==========
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    isDarkMode.value = false
    document.documentElement.style.colorScheme = 'light'
  } else {
    isDarkMode.value = true
    document.documentElement.style.colorScheme = 'dark'
  }
  loadGames()
})
</script>

<template>
  <div class="app-container" :class="{ dark: isDarkMode, light: !isDarkMode }">
    <!-- ========== FULL SCREEN BACKGROUND ========== -->
    <div 
      class="app-background" 
      :style="{
        backgroundImage: `url(${getGameBackground(selectedGame?.title || 'Valorant')})`
      }"
    >
      <div class="app-background-overlay"></div>
    </div>

    <!-- ========== MAIN LAYOUT ========== -->
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
        </div>

        <!-- ========== GAME GRID ========== -->
        <div v-if="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        
        <div v-else>
          <div class="game-grid">
            <div 
              v-for="game in filteredGames" 
              :key="game.id" 
              class="game-card"
              :style="{ backgroundImage: `url(${getGameImage(game.title)})` }"
              @click="selectGame(game)"
            >
              <div class="game-card-glass">
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
                  </div>
                  <div class="game-card-bottom">
                    <span class="game-edition">Standard Edition</span>
                    <span class="game-reviews"><i class="fas fa-star" style="color:#fbbf24;"></i> +{{ Math.floor(Math.random() * 50) + 10 }} Reviews</span>
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
      <aside class="right-panel" v-if="!showDetailView">
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

      <!-- ========== DETAIL OVERLAY ========== -->
      <div v-if="showDetailView" class="detail-overlay">
        <div class="detail-panel">
          <button class="detail-close" @click="goBack"><i class="fas fa-times"></i></button>
          <h2 class="detail-title">{{ selectedGame?.title }}</h2>
          <span class="detail-count">{{ gameAlts.length }} Alts</span>

          <div class="detail-actions">
            <button class="add-alt-btn" @click="openAddAltModal">
              <i class="fas fa-user-plus"></i> Add Alt Account
            </button>
          </div>

          <div v-if="gameAlts.length === 0" class="empty-state">
            <p><i class="fas fa-user-slash"></i> No alts yet for {{ selectedGame?.title }}</p>
            <p class="empty-sub">Add your first alt above!</p>
          </div>

          <div v-else class="alt-grid">
            <AltCard 
              v-for="alt in gameAlts" 
              :key="alt.id" 
              :alt="alt"
              @update="handleAltUpdated"
              @delete="handleAltDeleted"
            />
          </div>
        </div>
      </div>

      <!-- ========== ADD ALT MODAL ========== -->
      <AddAltModal
        :game-id="selectedGame?.id || ''"
        :game-title="selectedGame?.title || ''"
        :is-open="showAddAltModal"
        @close="closeAddAltModal"
        @added="handleAltAdded"
      />
    </div>

    <!-- ========== MENU DRAWER ========== -->
    <div v-if="showMenu" class="menu-overlay" @click="showMenu = false">
      <div class="menu-drawer" @click.stop>
        <div class="menu-header">
          <i class="fas fa-user-circle menu-avatar"></i>
          <div>
            <h4>Gunjit</h4>
            <span class="menu-email">gunjit@email.com</span>
          </div>
          <button class="menu-close" @click="showMenu = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="menu-stats">
          <div class="menu-stat">
            <span class="menu-stat-value">{{ games.length }}</span>
            <span class="menu-stat-label">Games</span>
          </div>
          <div class="menu-stat">
            <span class="menu-stat-value">{{ totalAlts }}</span>
            <span class="menu-stat-label">Alts</span>
          </div>
          <div class="menu-stat">
            <span class="menu-stat-value">{{ totalPlaytime }}h</span>
            <span class="menu-stat-label">Playtime</span>
          </div>
        </div>
        <div class="menu-items">
          <div class="menu-item" @click="toggleTheme">
            <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
          </div>
          <div class="menu-item"><i class="fas fa-cog"></i> Settings</div>
          <div class="menu-item"><i class="fas fa-database"></i> Backup</div>
          <div class="menu-item menu-item-danger"><i class="fas fa-sign-out-alt"></i> Logout</div>
        </div>
      </div>
    </div>

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
              <button class="file-upload-btn"><i class="fas fa-folder-open"></i> Choose File</button>
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
  </div>
</template>

<style scoped>
/* ========== CSS VARIABLES ========== */
.app-container {
  --bg-primary: #0a0e17;
  --bg-secondary: #111b26;
  --bg-card: rgba(10, 14, 23, 0.65);
  --bg-card-hover: rgba(10, 14, 23, 0.55);
  --bg-glass: rgba(0, 0, 0, 0.35);
  --bg-menu: rgba(17, 27, 38, 0.95);
  --bg-modal: rgba(17, 27, 38, 0.95);
  --bg-sidebar: rgba(10, 14, 23, 0.85);
  --bg-panel: rgba(10, 14, 23, 0.7);
  
  --text-primary: #ffffff;
  --text-secondary: #c8d0d8;
  --text-muted: rgba(200, 208, 216, 0.6);
  --text-dim: rgba(200, 208, 216, 0.3);
  
  --border-color: rgba(255, 255, 255, 0.06);
  --border-light: rgba(255, 255, 255, 0.08);
  
  --shadow-color: rgba(108, 140, 255, 0.15);
  
  --gradient-start: #6c8cff;
  --gradient-end: #a855f7;
  
  min-height: 100vh;
  font-family: 'Segoe UI', -apple-system, sans-serif;
}

/* ========== LIGHT THEME ========== */
.app-container.light {
  --bg-primary: #f0f2f5;
  --bg-secondary: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.7);
  --bg-card-hover: rgba(255, 255, 255, 0.8);
  --bg-glass: rgba(255, 255, 255, 0.5);
  --bg-menu: rgba(255, 255, 255, 0.95);
  --bg-modal: rgba(255, 255, 255, 0.95);
  --bg-sidebar: rgba(255, 255, 255, 0.85);
  --bg-panel: rgba(255, 255, 255, 0.7);
  
  --text-primary: #1a1a2e;
  --text-secondary: #2d2d44;
  --text-muted: rgba(45, 45, 68, 0.6);
  --text-dim: rgba(45, 45, 68, 0.3);
  
  --border-color: rgba(0, 0, 0, 0.06);
  --border-light: rgba(0, 0, 0, 0.08);
}

/* ========== BACKGROUND ========== */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
  transition: background-image 0.8s ease;
}

.app-background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 14, 23, 0.75);
  backdrop-filter: blur(2px);
}

.app-container.light .app-background-overlay {
  background: rgba(240, 242, 245, 0.8);
}

/* ========== LAYOUT ========== */
.app-layout {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
  gap: 0;
}

/* ========== LEFT SIDEBAR (Icon Only) ========== */
.sidebar {
  width: 64px;
  background: var(--bg-sidebar);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  padding: 20px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-brand {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
  width: 100%;
  text-align: center;
}

.brand-icon {
  font-size: 28px;
  color: var(--gradient-start);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  width: 100%;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.nav-item:hover {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-glass);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.nav-icon {
  font-size: 20px;
}

.sidebar-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.sidebar-stat {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-number {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-icon {
  font-size: 14px;
  color: var(--text-dim);
}

/* ========== MAIN CONTENT ========== */
.main-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  max-height: 100vh;
}

/* ========== HEADER ========== */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.greeting {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.greeting-text {
  font-size: 13px;
  color: var(--text-muted);
}

.greeting-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.search-bar {
  display: flex;
  align-items: center;
  background: var(--bg-glass);
  border-radius: 10px;
  padding: 6px 14px;
  border: 1px solid var(--border-light);
  flex: 1;
  max-width: 300px;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--gradient-start);
}

.search-icon {
  color: var(--text-dim);
  font-size: 14px;
  margin-right: 8px;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  padding: 6px 0;
  width: 100%;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-dim);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.theme-toggle:hover {
  border-color: var(--gradient-start);
}

.profile-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 24px;
  color: var(--text-secondary);
}

.profile-icon:hover {
  border-color: var(--gradient-start);
}

/* ========== CATEGORY TABS ========== */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-tab {
  padding: 6px 16px;
  border-radius: 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab:hover {
  border-color: var(--gradient-start);
  color: var(--text-primary);
}

.category-tab.active {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border-color: transparent;
  color: #fff;
}

.category-tab.see-more {
  border-style: dashed;
}

.category-tab.see-more:hover {
  border-color: var(--gradient-start);
  background: rgba(108, 140, 255, 0.05);
}

/* ========== GAME GRID ========== */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* ========== GAME CARD ========== */
.game-card {
  border-radius: 14px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 220px;
}

.game-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 50px var(--shadow-color);
}

.game-card-glass {
  background: var(--bg-card);
  backdrop-filter: blur(14px);
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: background 0.3s ease;
}

.game-card:hover .game-card-glass {
  background: var(--bg-card-hover);
}

.game-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.game-card-top {
  flex: 1;
}

.game-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.game-icon {
  font-size: 24px;
  color: var(--gradient-start);
}

.game-status {
  font-size: 11px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.game-title {
  margin: 4px 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.game-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.game-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.game-edition {
  color: var(--text-dim);
  font-weight: 500;
}

.game-reviews {
  color: var(--text-muted);
}

/* ========== ADD GAME CARD ========== */
.add-game-card {
  border: 2px dashed var(--border-light);
  background: transparent;
}

.add-game-card:hover {
  border-color: var(--gradient-start);
  background: rgba(108, 140, 255, 0.03);
}

.add-game-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.add-game-content {
  text-align: center;
}

.add-icon {
  font-size: 32px;
  color: var(--gradient-start);
  display: block;
  margin-bottom: 6px;
}

.add-title {
  margin: 0;
  color: var(--text-dim);
  font-size: 16px;
  font-weight: 400;
}

.add-sub {
  color: var(--text-dim);
  font-size: 12px;
  margin: 2px 0 0 0;
}

/* ========== SEE MORE SECTION ========== */
.see-more-section {
  margin-top: 20px;
  text-align: right;
}

.see-more-link {
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
}

.see-more-link:hover {
  color: var(--gradient-start);
}

.see-more-link i {
  margin-left: 4px;
}

/* ========== RIGHT PANEL ========== */
.right-panel {
  width: 240px;
  background: var(--bg-panel);
  backdrop-filter: blur(20px);
  border-left: 1px solid var(--border-color);
  padding: 24px 18px;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 100vh;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.total-hours {
  background: var(--bg-glass);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
}

.total-hours-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.total-hours-label {
  font-size: 12px;
  color: var(--text-dim);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.panel-stat {
  text-align: center;
  background: var(--bg-glass);
  border-radius: 10px;
  padding: 10px 8px;
  border: 1px solid var(--border-color);
}

.panel-stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-stat-label {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.panel-game-card {
  background: var(--bg-glass);
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.panel-game-card.highlight {
  border-color: var(--gradient-start);
  background: rgba(108, 140, 255, 0.05);
}

.panel-game-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-game-icon {
  font-size: 20px;
  color: var(--gradient-start);
}

.panel-game-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.panel-game-hours {
  font-size: 11px;
  color: var(--text-dim);
}

.panel-download-progress {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
  border-radius: 4px;
  width: 0%;
  transition: width 0.6s ease;
}

.progress-text {
  font-size: 10px;
  color: var(--text-dim);
}

/* ========== DETAIL OVERLAY ========== */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.detail-panel {
  background: var(--bg-modal);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-close {
  float: right;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 24px;
  cursor: pointer;
}

.detail-close:hover {
  color: var(--text-secondary);
}

.detail-title {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.detail-count {
  font-size: 14px;
  color: var(--text-dim);
}

.detail-actions {
  margin: 16px 0 20px 0;
}

.add-alt-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-alt-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.alt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.alt-card {
  background: var(--bg-glass);
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
}

.alt-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.alt-icon {
  font-size: 16px;
  color: var(--gradient-start);
}

.alt-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.alt-level-badge {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  color: #fff;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.alt-card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.alt-stat .stat-label {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.alt-stat .stat-value {
  font-size: 13px;
  color: var(--text-secondary);
}

.alt-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.progress-label {
  font-size: 10px;
  color: var(--text-dim);
  width: 100%;
}

.progress-tag {
  background: var(--bg-glass);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 9px;
  color: var(--gradient-start);
  border: 1px solid rgba(108, 140, 255, 0.15);
}

.alt-no-progress {
  font-size: 10px;
  color: var(--text-dim);
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

/* ========== EMPTY STATE & LOADING ========== */
.empty-state {
  text-align: center;
  padding: 30px 0;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-dim);
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: var(--text-dim);
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--text-dim);
}

/* ========== MENU DRAWER ========== */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  animation: fadeIn 0.25s ease;
}

.menu-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100vh;
  background: var(--bg-menu);
  backdrop-filter: blur(20px);
  padding: 24px;
  border-left: 1px solid var(--border-light);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.menu-avatar {
  font-size: 36px;
  color: var(--gradient-start);
}

.menu-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
}

.menu-email {
  font-size: 13px;
  color: var(--text-dim);
}

.menu-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 20px;
  cursor: pointer;
}

.menu-close:hover {
  color: var(--text-secondary);
}

.menu-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-glass);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.menu-stat {
  text-align: center;
}

.menu-stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.menu-stat-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-secondary);
}

.menu-item:hover {
  background: var(--bg-secondary);
}

.menu-item-danger {
  color: #ef4444;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.menu-item-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* ========== MODAL ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--bg-modal);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  width: 440px;
  max-width: 90%;
  border: 1px solid var(--border-light);
  animation: scaleIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 20px;
  cursor: pointer;
}

.modal-close:hover {
  color: var(--text-secondary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: var(--gradient-start);
}

.file-upload {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-upload-btn {
  padding: 8px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
}

.file-upload-btn:hover {
  background: var(--bg-secondary);
}

.file-upload-text {
  color: var(--text-dim);
  font-size: 13px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.modal-cancel {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.modal-cancel:hover {
  background: var(--bg-glass);
}

.modal-confirm {
  padding: 8px 24px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s, transform 0.1s;
}

.modal-confirm:hover {
  opacity: 0.9;
}

.modal-confirm:active {
  transform: scale(0.97);
}
</style>