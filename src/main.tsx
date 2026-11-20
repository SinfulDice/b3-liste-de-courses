import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* R35 : BrowserRouter lit l'adresse du navigateur (/, /liste) et la donne à <Routes>. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
