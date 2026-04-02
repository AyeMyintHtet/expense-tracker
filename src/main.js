import { createApp } from 'vue'
import Toast from 'vue-toastification'

import 'vue-toastification/dist/index.css'
import './assets/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(Toast)
app.mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`

    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('[PWA] service worker registration failed:', error)
    })
  })
}
