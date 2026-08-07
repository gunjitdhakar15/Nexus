import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import GameDetailView from '@/views/GameDetailView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game/:id', name: 'game-detail', component: GameDetailView },
  ],
})

export default router
