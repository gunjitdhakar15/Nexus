<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type Game, type AltAccount } from '@/services/api'
import { useGames } from '@/stores/games'
import { useUI } from '@/stores/ui'
import { getGameIcon } from '@/utils/gameIcons'
import AddAltModal from '@/components/modals/AddAltModal.vue'
import AltCard from '@/components/details/AltCard.vue'

const route = useRoute()
const router = useRouter()
const gamesStore = useGames()
const { isDarkMode, toggleTheme, showMenu } = useUI()

const gameId = computed(() => String(route.params.id))

const game = ref<Game | null>(null)
const gameAlts = ref<AltAccount[]>([])
const loading = ref(false)
const showAddAltModal = ref(false)

const loadGame = async () => {
  const found = gamesStore.games.value.find((g) => g.id === gameId.value)
  if (found) {
    game.value = found
    return
  }
  if (gamesStore.games.value.length === 0) {
    await gamesStore.loadGames()
  }
  game.value = gamesStore.games.value.find((g) => g.id === gameId.value) || null
}

const loadAlts = async () => {
  loading.value = true
  try {
    const result = await api.GetAltsByGame(gameId.value)
    gameAlts.value = result
  } catch (err) {
    console.error('Error loading alts:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'home' })
}

const openAddAltModal = () => {
  showAddAltModal.value = true
}

const closeAddAltModal = () => {
  showAddAltModal.value = false
}

const handleAltAdded = async () => {
  closeAddAltModal()
  await loadAlts()
  await gamesStore.loadAltPreview(gameId.value)
}

const handleAltUpdated = async (updatedAlt: any) => {
  const idx = gameAlts.value.findIndex((a) => a.id === updatedAlt.id)
  if (idx !== -1) {
    gameAlts.value[idx] = updatedAlt
  }
  const previews = gamesStore.altPreviews.value[gameId.value]
  const previewIdx = previews?.findIndex((a) => a.id === updatedAlt.id) ?? -1
  if (previewIdx >= 0) {
    gamesStore.altPreviews.value[gameId.value][previewIdx] = updatedAlt
  }
}

const handleAltDeleted = async (altId: string) => {
  gameAlts.value = gameAlts.value.filter((a) => a.id !== altId)
  gamesStore.altPreviews.value[gameId.value] =
    gamesStore.altPreviews.value[gameId.value]?.filter((a) => a.id !== altId) || []
}

onMounted(async () => {
  await loadGame()
  await loadAlts()
})
</script>

<template>
  <div class="detail-page">
    <!-- ========== TOP BAR ========== -->
    <header class="detail-topbar">
      <button class="back-btn" @click="goBack" title="Back to home">
        <i class="fas fa-arrow-left"></i>
      </button>

      <div class="detail-title-wrap">
        <i :class="['fas', getGameIcon(game?.title || ''), 'detail-game-icon']"></i>
        <div>
          <h1 class="detail-title">{{ game?.title || 'Game' }}</h1>
          <span class="detail-count">{{ gameAlts.length }} Alts</span>
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

    <!-- ========== ACTIONS ========== -->
    <div class="detail-actions">
      <button class="add-alt-btn" @click="openAddAltModal">
        <i class="fas fa-user-plus"></i> Add Alt Account
      </button>
    </div>

    <!-- ========== ALTS ========== -->
    <div v-if="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>

    <div v-else-if="gameAlts.length === 0" class="empty-state">
      <p><i class="fas fa-user-slash"></i> No alts yet for {{ game?.title }}</p>
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

    <!-- ========== ADD ALT MODAL ========== -->
    <AddAltModal
      :game-id="game?.id || ''"
      :game-title="game?.title || ''"
      :is-open="showAddAltModal"
      @close="closeAddAltModal"
      @added="handleAltAdded"
    />
  </div>
</template>

<style scoped>
.detail-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.detail-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.back-btn:hover {
  border-color: var(--gradient-start);
  color: var(--text-primary);
  transform: translateX(-2px);
}

.detail-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.detail-game-icon {
  font-size: 36px;
  color: var(--gradient-start);
  filter: drop-shadow(0 0 14px rgba(108, 140, 255, 0.4));
}

.detail-title {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
}

.detail-count {
  font-size: 14px;
  color: var(--text-dim);
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
  transition: all 0.2s;
}

.add-alt-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.alt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}</style>
