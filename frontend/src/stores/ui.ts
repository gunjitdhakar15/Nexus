import { ref } from 'vue'

const isDarkMode = ref(true)
const showMenu = ref(false)

export function useUI() {
  const initTheme = () => {
    const saved = localStorage.getItem('theme')
    isDarkMode.value = saved !== 'light'
    document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
  }

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
  }

  return { isDarkMode, showMenu, initTheme, toggleTheme }
}

export const demoNotice = (feature: string) => {
  alert(
    `${feature} isn't available in this web demo.\nDownload the desktop app for the full experience.`
  )
}
