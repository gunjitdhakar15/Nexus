import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import GameDetailView from '@/views/GameDetailView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game/:id', name: 'game-detail', component: GameDetailView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
