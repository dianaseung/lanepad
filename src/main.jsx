import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { VimProvider } from './context/VimContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VimProvider>
      <App />
    </VimProvider>
  </React.StrictMode>
)