import { ref } from 'vue'
import { api } from '../services/api'

const rawsgApiKey = ref('')
const steamApiKey = ref('')
const steamId = ref('')
const loaded = ref(false)

export function useSettings() {
  const loadSettings = async () => {
    try {
      const settings = await api.GetSettings()
      rawsgApiKey.value = settings['rawg_api_key'] || ''
      steamApiKey.value = settings['steam_api_key'] || ''
      steamId.value = settings['steam_id'] || ''
      loaded.value = true
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  const saveSettings = async () => {
    await api.SaveSettings({
      rawg_api_key: rawsgApiKey.value.trim(),
      steam_api_key: steamApiKey.value.trim(),
      steam_id: steamId.value.trim(),
    })
  }

  return {
    rawsgApiKey,
    steamApiKey,
    steamId,
    loaded,
    loadSettings,
    saveSettings,
  }
}
