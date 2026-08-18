import { ref } from 'vue'

const isDarkMode = ref(true)
const showMenu = ref(false)
const showCartModal = ref(false)
const showNotificationsModal = ref(false)
const showChatModal = ref(false)
const activeFriend = ref<string | null>(null)
const toastMessage = ref<string | null>(null)

export function useUI() {
  const initTheme = () => {
    isDarkMode.value = true
    document.documentElement.style.colorScheme = 'dark'
  }

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
  }

  const showToast = (msg: string) => {
    toastMessage.value = msg
    setTimeout(() => {
      if (toastMessage.value === msg) {
        toastMessage.value = null
      }
    }, 3000)
  }

  return {
    isDarkMode,
    showMenu,
    showCartModal,
    showNotificationsModal,
    showChatModal,
    activeFriend,
    toastMessage,
    initTheme,
    toggleTheme,
    showToast,
  }
}

export const demoNotice = (feature: string) => {
  alert(
    `${feature} is fully operational in the desktop app.`
  )
}
