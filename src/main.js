import { createApp } from 'vue'
import Toast from 'vue-toastification'

import 'vue-toastification/dist/index.css'
import './assets/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(Toast)
app.mount('#app')

const PWA_UPDATE_EVENT = 'spent:pwa-update-available'
const RELOAD_AFTER_UPDATE_KEY = 'spent_reload_after_sw_update'

const notifyPwaUpdate = (registration) => {
  window.dispatchEvent(
    new CustomEvent(PWA_UPDATE_EVENT, {
      detail: { registration },
    }),
  )
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`

    try {
      const registration = await navigator.serviceWorker.register(swUrl)

      if (registration.waiting) {
        notifyPwaUpdate(registration)
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            notifyPwaUpdate(registration)
          }
        })
      })
    } catch (error) {
      console.error('[PWA] service worker registration failed:', error)
    }
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const shouldReload = sessionStorage.getItem(RELOAD_AFTER_UPDATE_KEY) === '1'
    if (!shouldReload) return

    sessionStorage.removeItem(RELOAD_AFTER_UPDATE_KEY)
    window.location.reload()
  })
}
