import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { DemoStoreProvider } from './state/DemoStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoStoreProvider>
        <App />
      </DemoStoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
