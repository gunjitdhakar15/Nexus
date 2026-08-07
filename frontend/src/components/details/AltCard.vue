<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../../services/api'

interface Props {
  alt: {
    id: string
    gameId: string
    name: string
    level: number
    playtimeHours: number
    lastPlayed: string
    progress: Record<string, any>
  }
}

interface Emits {
  (e: 'update', alt: any): void
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditing = ref(false)
const editName = ref(props.alt.name)
const editLevel = ref(props.alt.level)
const editPlaytime = ref(props.alt.playtimeHours)
const editLastPlayed = ref(props.alt.lastPlayed)
const editProgress = ref({ ...props.alt.progress })
const newProgressKey = ref('')
const newProgressValue = ref('')
const loading = ref(false)
const error = ref('')

const today = new Date().toISOString().split('T')[0]

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    editName.value = props.alt.name
    editLevel.value = props.alt.level
    editPlaytime.value = props.alt.playtimeHours
    editLastPlayed.value = props.alt.lastPlayed
    editProgress.value = { ...props.alt.progress }
    error.value = ''
  }
}

const addProgressItem = () => {
  if (newProgressKey.value.trim() && newProgressValue.value.trim()) {
    editProgress.value[newProgressKey.value.trim()] = newProgressValue.value.trim()
    newProgressKey.value = ''
    newProgressValue.value = ''
  }
}

const removeProgressItem = (key: string) => {
  delete editProgress.value[key]
}

const handleSave = async () => {
  if (!editName.value.trim()) {
    error.value = 'Alt name is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await api.UpdateAlt(
      props.alt.id,
      editName.value.trim(),
      editLevel.value,
      editPlaytime.value,
      editLastPlayed.value,
      editProgress.value
    )
    
    emit('update', {
      ...props.alt,
      name: editName.value.trim(),
      level: editLevel.value,
      playtimeHours: editPlaytime.value,
      lastPlayed: editLastPlayed.value,
      progress: editProgress.value
    })
    
    isEditing.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to update alt'
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this alt?')) return
  
  loading.value = true
  try {
    await api.DeleteAlt(props.alt.id)
    emit('delete', props.alt.id)
  } catch (err: any) {
    error.value = err.message || 'Failed to delete alt'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === 'Never') return 'Never'
  return dateStr.slice(0, 10)
}
</script>

<template>
  <div class="alt-card">
    <div class="alt-card-glass">
      <div v-if="!isEditing" class="alt-view">
        <div class="alt-card-header">
          <i class="fas fa-user-astronaut alt-icon"></i>
          <span class="alt-name">{{ alt.name }}</span>
          <span class="alt-level-badge"><i class="fas fa-star"></i> Lv.{{ alt.level }}</span>
        </div>
        <div class="alt-card-stats">
          <div class="alt-stat">
            <span class="stat-label"><i class="fas fa-clock"></i> Playtime</span>
            <span class="stat-value">{{ alt.playtimeHours }}h</span>
          </div>
          <div class="alt-stat">
            <span class="stat-label"><i class="fas fa-calendar"></i> Last</span>
            <span class="stat-value">{{ formatDate(alt.lastPlayed) }}</span>
          </div>
        </div>
        <div class="alt-progress" v-if="alt.progress && Object.keys(alt.progress).length > 0">
          <span class="progress-label"><i class="fas fa-list-check"></i> Progress:</span>
          <span v-for="(value, key) in alt.progress" :key="key" class="progress-tag">
            {{ key }}: {{ value }}
          </span>
        </div>
        <div v-else class="alt-no-progress"><i class="fas fa-hourglass"></i> No progress tracked</div>
        
        <div class="alt-actions">
          <button class="edit-btn" @click="toggleEdit">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="delete-btn" @click="handleDelete">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>

      <div v-else class="alt-edit-form">
        <div class="form-group">
          <label><i class="fas fa-user"></i> Name</label>
          <input v-model="editName" @keyup.enter="handleSave" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label><i class="fas fa-star"></i> Level</label>
            <input type="number" v-model.number="editLevel" min="1" max="1000" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-clock"></i> Playtime (h)</label>
            <input type="number" v-model.number="editPlaytime" min="0" />
          </div>
        </div>

        <div class="form-group">
          <label><i class="fas fa-calendar"></i> Last Played</label>
          <input type="date" v-model="editLastPlayed" :max="today" />
        </div>

        <div class="form-group">
          <label><i class="fas fa-list-check"></i> Progress</label>
          <div class="progress-inputs">
            <div class="progress-input-row">
              <input v-model="newProgressKey" placeholder="Key (e.g., Quest, Rank)" @keyup.enter="addProgressItem" />
              <input v-model="newProgressValue" placeholder="Value (e.g., Done, Gold 1)" @keyup.enter="addProgressItem" />
              <button type="button" class="add-progress-btn" @click="addProgressItem"><i class="fas fa-plus"></i></button>
            </div>
            <div v-if="Object.keys(editProgress).length > 0" class="progress-tags">
              <span v-for="(value, key) in editProgress" :key="key" class="progress-tag">
                {{ key }}: {{ value }}
                <button type="button" @click="removeProgressItem(String(key))"><i class="fas fa-times"></i></button>
              </span>
            </div>
            <p v-else class="progress-hint">Add custom progress tracking (optional)</p>
          </div>
        </div>

        <div v-if="error" class="form-error">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </div>

        <div class="modal-footer">
          <button type="button" class="modal-cancel" @click="toggleEdit">Cancel</button>
          <button type="button" class="modal-confirm" @click="handleSave" :disabled="loading">
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i v-else class="fas fa-save"></i> {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alt-card-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur, 20px));
  -webkit-backdrop-filter: blur(var(--glass-blur, 20px));
  padding: 16px 18px;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 28px rgba(0, 0, 0, 0.3);
}

.alt-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alt-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
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

.alt-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.edit-btn, .delete-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-light);
}

.edit-btn {
  background: var(--bg-glass);
  color: var(--text-secondary);
}

.edit-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--gradient-start);
}

.delete-btn {
  background: var(--bg-glass);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* Edit Form Styles */
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

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
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

.modal-confirm:hover:not(:disabled) {
  opacity: 0.9;
}

.modal-confirm:active {
  transform: scale(0.97);
}

.modal-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>