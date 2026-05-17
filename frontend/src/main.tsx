import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { fromNullable, isSome } from '@tsfpp/prelude'
import './index.css'
import App from './App.tsx'

const rootElement = fromNullable(document.getElementById('root'))

if (isSome(rootElement)) {
  createRoot(rootElement.value).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
