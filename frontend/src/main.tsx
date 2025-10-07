import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Account from './Account.tsx'
import Upload from './Upload.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Upload />
    <Account />
  </StrictMode>,
)
