<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/stores/settings'
import { isDesktopDemo } from '@/utils/env'

const router = useRouter()
const { rawsgApiKey, steamApiKey, steamId, loadSettings, saveSettings } = useSettings()

const saving = ref(false)
const saved = ref(false)
const error = ref('')

const goBack = () => router.push({ name: 'home' })

const handleSave = async () => {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await saveSettings()
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch (err: any) {
    error.value = err.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isDesktopDemo()) loadSettings()
})
</script>

<template>
  <div class="settings-page">
    <header class="settings-topbar">
      <button class="back-btn" @click="goBack" title="Back to home">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="settings-title-wrap">
        <i class="fas fa-cog detail-game-icon"></i>
        <div>
          <h1 class="settings-title">Settings</h1>
          <span class="settings-sub">Integrations & API keys</span>
        </div>
      </div>
    </header>

    <div class="settings-card">
      <div class="settings-card-header">
        <h3><i class="fas fa-plug"></i> Integrations</h3>
        <span class="settings-hint" v-if="isDesktopDemo()">
          <i class="fas fa-flask"></i> Demo mode: keys are stored in this browser
        </span>
        <span class="settings-hint" v-else>
          <i class="fas fa-database"></i> Stored in the app's local database
        </span>
      </div>

      <!-- RAWG -->
      <div class="integration-block">
        <div class="integration-title">
          <div>
            <strong>RAWG</strong>
            <span>Auto-fetch cover art, ratings & release dates when you add a game.</span>
          </div>
          <span class="free-badge">Free key</span>
        </div>
        <div class="form-group">
          <label>RAWG API Key</label>
          <input
            v-model="rawsgApiKey"
            placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
          />
        </div>
        <a href="https://rawg.io/apidocs" target="_blank" rel="noopener" class="get-key-link">
          <i class="fas fa-external-link-alt"></i> Get a free RAWG key
        </a>
      </div>

      <!-- STEAM -->
      <div class="integration-block">
        <div class="integration-title">
          <div>
            <strong>Steam</strong>
            <span>Import your owned games and total playtime into your library.</span>
          </div>
          <span class="free-badge">Free key</span>
        </div>
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
          />
        </div>
        <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener" class="get-key-link">
          <i class="fas fa-external-link-alt"></i> Get your Steam API key
        </a>
      </div>

      <div class="settings-error" v-if="error"><i class="fas fa-exclamation-circle"></i> {{ error }}</div>
      <div class="settings-success" v-if="saved"><i class="fas fa-check-circle"></i> Settings saved</div>

      <div class="settings-footer">
        <button class="modal-cancel" @click="goBack">Cancel</button>
        <button class="modal-confirm" @click="handleSave" :disabled="saving">
          <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 24px 32px;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
}

.settings-topbar {
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

.settings-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-game-icon {
  font-size: 30px;
  color: var(--gradient-start);
  filter: drop-shadow(0 0 14px rgba(108, 140, 255, 0.4));
}

.settings-title {
  font-size: 26px;
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
}

.settings-sub {
  font-size: 13px;
  color: var(--text-dim);
}

.settings-card {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-light);
  border-radius: 18px;
  padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 40px rgba(0, 0, 0, 0.3);
}

.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.settings-card-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.settings-hint {
  font-size: 12px;
  color: var(--text-dim);
}

.integration-block {
  padding: 18px 0;
  border-bottom: 1px solid var(--border-color);
}

.integration-block:last-of-type {
  border-bottom: none;
}

.integration-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.integration-title strong {
  display: block;
  color: var(--text-primary);
  font-size: 16px;
}

.integration-title span {
  color: var(--text-muted);
  font-size: 13px;
}

.free-badge {
  flex-shrink: 0;
  font-size: 11px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.25);
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.get-key-link {
  font-size: 13px;
  color: var(--gradient-start);
  text-decoration: none;
}

.get-key-link:hover {
  text-decoration: underline;
}

.settings-error {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 13px;
}

.settings-success {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: #4ade80;
  font-size: 13px;
}

.settings-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
