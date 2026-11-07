import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Nainstalovaná appka (ikona na ploše) se na iPhonu nezavírá – běží na pozadí klidně týdny
// a bez vlastní kontroly by novou verzi nestáhla, dokud ji uživatel ručně neodstřelí.
// Proto se na novou verzi ptáme při každém návratu do appky a pak jednou za hodinu;
// při nalezení nové verze se appka sama překreslí (registerType: 'autoUpdate').
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const checkForUpdate = () => {
      registration.update().catch(() => {
        // Offline nebo výpadek serveru – zkusí se při dalším návratu do appky.
      })
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
    setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
