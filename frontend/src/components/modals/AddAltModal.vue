<script setup lang="ts">
import { ref, watch } from 'vue'
import AddAltForm from '@/components/details/AddAltForm.vue'

interface Props {
  gameId: string
  gameTitle: string
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'added', alt: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showForm = ref(true)

watch(() => props.isOpen, (val) => {
  if (val) {
    showForm.value = true
  }
})

const handleClose = () => {
  emit('close')
}

const handleAdded = (alt: any) => {
  emit('added', alt)
  showForm.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-user-plus"></i> Add Alt Account</h3>
          <button class="modal-close" @click="handleClose"><i class="fas fa-times"></i></button>
        </div>
        
        <AddAltForm 
          v-if="showForm"
          :game-id="gameId"
          :game-title="gameTitle"
          @close="handleClose"
          @added="handleAdded"
        />
        
        <div v-else class="modal-success">
          <i class="fas fa-check-circle"></i>
          <h4>Alt Added Successfully!</h4>
          <p>Your new alt account has been created.</p>
          <button class="modal-confirm" @click="handleClose">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  width: 480px;
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

.modal-success {
  padding: 40px 24px;
  text-align: center;
}

.modal-success i {
  font-size: 48px;
  color: #4ade80;
  margin-bottom: 16px;
}

.modal-success h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.modal-success p {
  margin: 0 0 24px 0;
  color: var(--text-dim);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>