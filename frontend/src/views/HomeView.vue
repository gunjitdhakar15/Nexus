<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGames } from '@/stores/games'
import { useUI, demoNotice } from '@/stores/ui'
import { getGameIcon } from '@/utils/gameIcons'
import type { Game } from '@/services/api'

const router = useRouter()
const gamesStore = useGames()
const { isDarkMode, toggleTheme, showMenu } = useUI()

const { games, loading, altPreviews, totalAlts, totalPlaytime, mostPlayedGame, recentGames, addGame } = gamesStore

const showAddGameModal = ref(false)
const newGameTitle = ref('')
const searchQuery = ref('')
const selectedCategory = ref('Popular')

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

onMounted(() => {
  if (games.value.length === 0) {
    gamesStore.loadGames()
  }
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
  </div>
</template>
