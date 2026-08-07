<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../services/api'

interface Props {
  gameId: string
  gameTitle: string
}

interface Emits {
  (e: 'close'): void
  (e: 'added', alt: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const altName = ref('')
const altLevel = ref(1)
const altPlaytime = ref(0)
const lastPlayed = ref('')
const progress = ref<Record<string, any>>({})
const newProgressKey = ref('')
const newProgressValue = ref('')
const loading = ref(false)
const error = ref('')

const today = new Date().toISOString().split('T')[0]

onMounted(() => {
  lastPlayed.value = today
})

const addProgressItem = () => {
  if (newProgressKey.value.trim() && newProgressValue.value.trim()) {
    progress.value[newProgressKey.value.trim()] = newProgressValue.value.trim()
    newProgressKey.value = ''
    newProgressValue.value = ''
  }
}

const removeProgressItem = (key: string) => {
  delete progress.value[key]
}

const handleSubmit = async () => {
  if (!altName.value.trim()) {
    error.value = 'Alt name is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const altId = await api.AddAlt(
      props.gameId,
      altName.value.trim(),
      altLevel.value,
      altPlaytime.value,
      lastPlayed.value,
      progress.value
    )
    
    emit('added', {
      id: altId,
      gameId: props.gameId,
      name: altName.value.trim(),
      level: altLevel.value,
      playtimeHours: altPlaytime.value,
      lastPlayed: lastPlayed.value,
      progress: progress.value
    })
  } catch (err: any) {
    error.value = err.message || 'Failed to add alt'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="modal-body">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label><i class="fas fa-user"></i> Alt Name</label>
        <input 
          v-model="altName" 
          placeholder="e.g., Main, Smurf, Alt #2"
          @keyup.enter="handleSubmit"
          autofocus
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label><i class="fas fa-star"></i> Level</label>
          <input 
            type="number" 
            v-model.number="altLevel" 
            min="1" 
            max="1000"
            placeholder="1"
          />
        </div>
        <div class="form-group">
          <label><i class="fas fa-clock"></i> Playtime (hours)</label>
          <input 
            type="number" 
            v-model.number="altPlaytime" 
            min="0" 
            placeholder="0"
          />
        </div>
      </div>

      <div class="form-group">
        <label><i class="fas fa-calendar"></i> Last Played</label>
        <input 
          type="date" 
          v-model="lastPlayed" 
          :max="today"
        />
      </div>

      <div class="form-group">
        <label><i class="fas fa-list-check"></i> Progress Tracking</label>
        <div class="progress-inputs">
          <div class="progress-input-row">
            <input 
              v-model="newProgressKey" 
              placeholder="e.g., Quest, Rank, Achievement"
              @keyup.enter="addProgressItem"
            />
            <input 
              v-model="newProgressValue" 
              placeholder="e.g., Completed, Gold 1, 100%"
              @keyup.enter="addProgressItem"
            />
            <button type="button" class="add-progress-btn" @click="addProgressItem">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div v-if="Object.keys(progress).length > 0" class="progress-tags">
            <span 
              v-for="(value, key) in progress" 
              :key="key" 
              class="progress-tag"
            >
              {{ key }}: {{ value }}
              <button type="button" @click="removeProgressItem(key)">
                <i class="fas fa-times"></i>
              </button>
            </span>
          </div>
          
          <p v-else class="progress-hint">Add custom progress tracking (optional)</p>
        </div>
      </div>

      <div v-if="error" class="form-error">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </div>

      <div class="modal-footer">
        <button type="button" class="modal-cancel" @click="handleClose">Cancel</button>
        <button type="submit" class="modal-confirm" :disabled="loading">
          <i class="fas fa-spinner fa-spin" v-if="loading"></i>
          <i v-else class="fas fa-plus"></i> {{ loading ? 'Adding...' : 'Add Alt' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.progress-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-input-row {
  display: flex;
  gap: 8px;
}

.progress-input-row input {
  flex: 1;
}

.add-progress-btn {
  padding: 8px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.add-progress-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--gradient-start);
}

.progress-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.progress-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-glass);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--gradient-start);
  border: 1px solid rgba(108, 140, 255, 0.15);
}

.progress-tag button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.progress-tag button:hover {
  opacity: 1;
  color: #ef4444;
}

.progress-hint {
  font-size: 12px;
  color: var(--text-dim);
  font-style: italic;
  margin: 0;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
}
</style>