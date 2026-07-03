<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GetAllGames, AddGame, GetAltsByGame } from '../wailsjs/go/main/App'

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

// ========== NAVIGATION ==========
const selectedGame = ref<Game | null>(null)
const gameAlts = ref<AltAccount[]>([])
const showDetailView = ref(false)

// ========== MENU DRAWER ==========
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

const filteredGames = computed(() => {
  if (!searchQuery.value) return games.value
  const q = searchQuery.value.toLowerCase()
  return games.value.filter(g => g.title.toLowerCase().includes(q))
})

// ========== HELPER FUNCTIONS ==========
const showAlert = (message: string) => {
  alert(message)
}

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
    showAlert('Error loading games: ' + err.message)
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
    showAlert('Error adding game: ' + err.message)
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

// ========== GAME IMAGES ==========
const getGameImage = (title: string): string => {
  const images: Record<string, string> = {
    'Valorant': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=800&fit=crop',
    'Elden Ring': 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=1200&h=800&fit=crop',
    'World of Warcraft': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=800&fit=crop',
    'Destiny 2': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=800&fit=crop',
    'Counter-Strike': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=800&fit=crop',
    'League of Legends': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=800&fit=crop',
  }
  return images[title] || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&h=800&fit=crop'
}

const getGameEmoji = (title: string): string => {
  const emojis: Record<string, string> = {
    'Elden Ring': '⚔️',
    'Valorant': '🔫',
    'World of Warcraft': '🧙',
    'Destiny 2': '🚀',
    'Counter-Strike': '🎯',
    'League of Legends': '👑',
  }
  return emojis[title] || '🎮'
}

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
    <!-- ========== BACKGROUND ========== -->
    <div 
      class="app-background" 
      :style="{
        backgroundImage: selectedGame 
          ? `url(${getGameImage(selectedGame.title)})` 
          : `url(https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1920&h=1080&fit=crop)`
      }"
    >
      <div class="app-background-overlay"></div>
    </div>

    <!-- ========== MAIN CONTENT ========== -->
    <div class="app-content">
      <!-- ========== HEADER ========== -->
      <header class="app-header">
        <div class="header-left">
          <h1>🚀 Nexus</h1>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              placeholder="Search games..."
              class="search-input"
            />
          </div>
        </div>
        <div class="header-right">
          <button class="theme-toggle" @click="toggleTheme">
            {{ isDarkMode ? '🌙' : '☀️' }}
          </button>
          <div class="profile-icon" @click="showMenu = !showMenu">
            <span class="avatar">👤</span>
            <div class="profile-info">
              <span class="avatar-text">Gunjit</span>
              <span class="profile-sub">Gamer</span>
            </div>
          </div>
          <button class="menu-btn" @click="showMenu = !showMenu">☰</button>
        </div>
      </header>

      <!-- ========== HOME VIEW ========== -->
      <div v-if="!showDetailView" class="home-view">
        <!-- ========== STATS ROW ========== -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-icon">🎮</span>
            <div class="stat-info">
              <span class="stat-value">{{ games.length }}</span>
              <span class="stat-label">Games</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⚔️</span>
            <div class="stat-info">
              <span class="stat-value">{{ totalAlts }}</span>
              <span class="stat-label">Alts</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <div class="stat-info">
              <span class="stat-value">{{ totalPlaytime }}h</span>
              <span class="stat-label">Playtime</span>
            </div>
          </div>
          <div class="stat-card stat-add" @click="showAddGameModal = true">
            <span class="stat-icon">➕</span>
            <div class="stat-info">
              <span class="stat-value">Add</span>
              <span class="stat-label">New Game</span>
            </div>
          </div>
        </div>

        <!-- ========== GAME GRID ========== -->
        <div v-if="loading" class="loading">Loading...</div>
        
        <div v-else>
          <div class="section-header">
            <h2>📚 My Games</h2>
            <span class="section-count">{{ filteredGames.length }} games</span>
          </div>

          <div class="uniform-grid">
            <!-- Game Cards -->
            <div 
              v-for="game in filteredGames" 
              :key="game.id" 
              class="game-card"
              :style="{ backgroundImage: `url(${getGameImage(game.title)})` }"
              @click="selectGame(game)"
            >
              <div class="game-card-glass">
                <div class="game-card-header">
                  <span class="game-icon-large">{{ getGameEmoji(game.title) }}</span>
                  <div class="game-info">
                    <h3>{{ game.title }}</h3>
                    <span class="game-playtime">⏱️ {{ game.totalPlaytime }}h total</span>
                  </div>
                </div>
                
                <div class="alt-preview">
                  <div 
                    v-for="alt in altPreviews[game.id] || []" 
                    :key="alt.id" 
                    class="alt-preview-item"
                  >
                    <span class="alt-preview-icon">⚔️</span>
                    <span class="alt-preview-name">{{ alt.name }}</span>
                    <span class="alt-preview-level">⭐ Lv.{{ alt.level }}</span>
                  </div>
                  <div v-if="!altPreviews[game.id] || altPreviews[game.id].length === 0" class="alt-preview-empty">
                    No alts yet
                  </div>
                  <span v-if="(altPreviews[game.id]?.length || 0) > 0" class="alt-preview-more">
                    + more
                  </span>
                </div>
                
                <div class="game-card-footer">
                  <span class="view-all">Click to manage →</span>
                </div>
              </div>
            </div>

            <!-- Add New Game Card -->
            <div class="add-game-card" @click="showAddGameModal = true">
              <div class="add-game-glass">
                <div class="add-game-content">
                  <span class="add-game-icon">➕</span>
                  <h4>Add New Game</h4>
                  <p class="add-game-sub">Click to add</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== DETAIL VIEW ========== -->
      <div v-else class="detail-view">
        <div class="detail-header">
          <button class="back-btn" @click="goBack">← Back</button>
          <h2>{{ selectedGame?.title }}</h2>
          <span class="alt-count-detail">{{ gameAlts.length }} Alts</span>
        </div>

        <div class="detail-actions">
          <button class="add-alt-btn" @click="showAlert('Add Alt coming soon!')">
            + Add Alt Account
          </button>
        </div>

        <div v-if="gameAlts.length === 0" class="empty-state">
          <p>👤 No alts yet for {{ selectedGame?.title }}</p>
          <p class="empty-sub">Add your first alt above!</p>
        </div>

        <div v-else class="uniform-grid">
          <div 
            v-for="alt in gameAlts" 
            :key="alt.id" 
            class="alt-card"
            :style="{ backgroundImage: `url(${getGameImage(selectedGame?.title || '')})` }"
          >
            <div class="alt-card-glass">
              <div class="alt-card-header">
                <span class="alt-icon">⚔️</span>
                <span class="alt-name">{{ alt.name }}</span>
                <span class="alt-level-badge">⭐ Lv.{{ alt.level }}</span>
              </div>
              <div class="alt-card-stats">
                <div class="alt-stat">
                  <span class="stat-label">Playtime</span>
                  <span class="stat-value">{{ alt.playtimeHours }}h</span>
                </div>
                <div class="alt-stat">
                  <span class="stat-label">Last Played</span>
                  <span class="stat-value">{{ alt.lastPlayed?.slice(0,10) || 'Never' }}</span>
                </div>
              </div>
              <div class="alt-progress" v-if="alt.progress && Object.keys(alt.progress).length > 0">
                <span class="progress-label">📌 Progress:</span>
                <span v-for="(value, key) in alt.progress" :key="key" class="progress-tag">
                  {{ key }}: {{ value }}
                </span>
              </div>
              <div v-else class="alt-no-progress">No progress tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== MENU DRAWER ========== -->
    <div v-if="showMenu" class="menu-overlay" @click="showMenu = false">
      <div class="menu-drawer" @click.stop>
        <div class="menu-header">
          <span class="menu-avatar">👤</span>
          <div>
            <h4>Gunjit</h4>
            <span class="menu-email">gunjit@email.com</span>
          </div>
          <button class="menu-close" @click="showMenu = false">✕</button>
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
            {{ isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode' }}
          </div>
          <div class="menu-item">⚙️ Settings</div>
          <div class="menu-item">💾 Backup Database</div>
          <div class="menu-item menu-item-danger">🚪 Logout</div>
        </div>
      </div>
    </div>

    <!-- ========== ADD GAME MODAL ========== -->
    <div v-if="showAddGameModal" class="modal-overlay" @click="showAddGameModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>➕ Add New Game</h3>
          <button class="modal-close" @click="showAddGameModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Game Name</label>
            <input 
              v-model="newGameTitle" 
              placeholder="e.g., Elden Ring, Valorant, WoW"
              @keyup.enter="handleAddGame"
              autofocus
            />
          </div>
          <div class="form-group">
            <label>Cover Art (optional)</label>
            <div class="file-upload">
              <button class="file-upload-btn">Choose File</button>
              <span class="file-upload-text">No file chosen</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showAddGameModal = false">Cancel</button>
          <button class="modal-confirm" @click="handleAddGame">Add Game</button>
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
  
  --text-primary: #ffffff;
  --text-secondary: #c8d0d8;
  --text-muted: rgba(200, 208, 216, 0.6);
  --text-dim: rgba(200, 208, 216, 0.3);
  
  --border-color: rgba(255, 255, 255, 0.06);
  --border-light: rgba(255, 255, 255, 0.08);
  --border-dashed: rgba(255, 255, 255, 0.08);
  
  --shadow-color: rgba(108, 140, 255, 0.15);
  --progress-bg: rgba(0, 0, 0, 0.4);
  --tag-border: rgba(108, 140, 255, 0.15);
  
  --gradient-start: #6c8cff;
  --gradient-end: #a855f7;
  
  position: relative;
  min-height: 100vh;
  font-family: 'Segoe UI', -apple-system, sans-serif;
  transition: background 0.3s ease, color 0.3s ease;
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
  
  --text-primary: #1a1a2e;
  --text-secondary: #2d2d44;
  --text-muted: rgba(45, 45, 68, 0.6);
  --text-dim: rgba(45, 45, 68, 0.3);
  
  --border-color: rgba(0, 0, 0, 0.06);
  --border-light: rgba(0, 0, 0, 0.08);
  --border-dashed: rgba(0, 0, 0, 0.08);
  
  --progress-bg: rgba(255, 255, 255, 0.5);
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
  transition: background-image 0.5s ease;
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

.app-content {
  position: relative;
  z-index: 1;
  padding: 24px 32px;
  min-height: 100vh;
}

/* ========== HEADER ========== */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.header-left h1 {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  white-space: nowrap;
}

.search-bar {
  display: flex;
  align-items: center;
  background: var(--bg-glass);
  border-radius: 12px;
  padding: 6px 14px;
  border: 1px solid var(--border-light);
  flex: 1;
  max-width: 400px;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--gradient-start);
}

.search-icon {
  color: var(--text-dim);
  font-size: 16px;
  margin-right: 8px;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  padding: 8px 0;
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
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  border-color: var(--gradient-start);
  transform: scale(1.05);
}

.profile-icon {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 16px 6px 8px;
  border-radius: 30px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  transition: all 0.2s;
}

.profile-icon:hover {
  border-color: var(--gradient-start);
}

.avatar {
  font-size: 28px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.avatar-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.profile-sub {
  font-size: 11px;
  color: var(--text-dim);
}

.menu-btn {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 20px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: var(--bg-secondary);
}

/* ========== STATS ROW ========== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 16px 20px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: var(--gradient-start);
  transform: translateY(-2px);
}

.stat-card.stat-add {
  cursor: pointer;
  border-style: dashed;
}

.stat-card.stat-add:hover {
  border-color: var(--gradient-start);
  background: rgba(108, 140, 255, 0.05);
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ========== SECTION HEADER ========== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.section-count {
  font-size: 13px;
  color: var(--text-dim);
  background: var(--bg-glass);
  padding: 2px 12px;
  border-radius: 12px;
}

/* ========== UNIFORM GRID ========== */
.uniform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}

/* ========== GAME CARD ========== */
.game-card {
  border-radius: 16px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 280px;
}

.game-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 60px var(--shadow-color);
}

.game-card-glass {
  background: var(--bg-card);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 18px 16px 16px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  transition: background 0.3s ease;
}

.game-card:hover .game-card-glass {
  background: var(--bg-card-hover);
}

.game-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.game-icon-large {
  font-size: 28px;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
  min-width: 0;
}

.game-info h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-playtime {
  font-size: 12px;
  color: var(--text-muted);
}

/* ========== ALT PREVIEW ========== */
.alt-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  margin-bottom: 12px;
  min-height: 60px;
}

.alt-preview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-glass);
  backdrop-filter: blur(4px);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 13px;
}

.alt-preview-icon {
  font-size: 12px;
}

.alt-preview-name {
  color: var(--text-primary);
  flex: 1;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alt-preview-level {
  color: var(--text-dim);
  font-size: 11px;
  flex-shrink: 0;
}

.alt-preview-empty {
  font-size: 12px;
  color: var(--text-dim);
  font-style: italic;
  padding: 4px 0;
}

.alt-preview-more {
  font-size: 11px;
  color: var(--text-dim);
  font-style: italic;
  text-align: right;
  padding: 2px 4px 0 0;
}

.game-card-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
  text-align: right;
}

.view-all {
  font-size: 12px;
  color: var(--text-dim);
  transition: color 0.2s;
}

.game-card:hover .view-all {
  color: var(--gradient-start);
}

/* ========== ADD GAME CARD ========== */
.add-game-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 2px dashed var(--border-dashed);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
  min-height: 280px;
}

.add-game-card:hover {
  border-color: var(--gradient-start);
  background: rgba(108, 140, 255, 0.03);
  transform: translateY(-6px);
}

.add-game-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  padding: 18px 16px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-game-content {
  text-align: center;
}

.add-game-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.add-game-content h4 {
  margin: 0;
  color: var(--text-dim);
  font-size: 16px;
  font-weight: 400;
}

.add-game-sub {
  color: var(--text-dim);
  font-size: 12px;
  margin: 4px 0 0 0;
}

/* ========== ALT CARD ========== */
.alt-card {
  border-radius: 16px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  transition: all 0.3s ease;
  min-height: 260px;
}

.alt-card:hover {
  transform: translateY(-6px);
}

.alt-card-glass {
  background: var(--bg-card);
  backdrop-filter: blur(14px);
  padding: 18px 16px 16px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  transition: background 0.3s;
}

.alt-card:hover .alt-card-glass {
  background: var(--bg-card-hover);
}

.alt-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.alt-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alt-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alt-level-badge {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.alt-card-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.alt-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-dim);
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.alt-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  flex: 1;
  align-content: flex-start;
}

.progress-label {
  font-size: 11px;
  color: var(--text-dim);
  width: 100%;
}

.progress-tag {
  background: var(--progress-bg);
  backdrop-filter: blur(4px);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  color: var(--gradient-start);
  border: 1px solid var(--tag-border);
}

.alt-no-progress {
  font-size: 11px;
  color: var(--text-dim);
  font-style: italic;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  flex: 1;
}

/* ========== DETAIL VIEW ========== */
.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-secondary);
}

.detail-header h2 {
  margin: 0;
  font-size: 22px;
  color: var(--text-primary);
  flex: 1;
}

.alt-count-detail {
  background: var(--bg-glass);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  border: 1px solid var(--border-light);
}

.detail-actions {
  margin-bottom: 24px;
}

.add-alt-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s, transform 0.1s;
}

.add-alt-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* ========== EMPTY STATE ========== */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-dim);
  margin: 0;
}

.empty-sub {
  font-size: 14px;
  color: var(--text-dim);
  margin-top: 6px;
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
  width: 320px;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
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

/* ========== SCROLLBAR ========== */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gradient-start);
}
</style>