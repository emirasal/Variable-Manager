// main.js
import { createApp } from 'vue'
import App from './App.vue'
import MainPage from './components/MainPage.vue'
import SignInPage from './components/SignInPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: MainPage },
  { path: '/signin', component: SignInPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
