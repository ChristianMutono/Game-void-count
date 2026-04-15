import React from 'react'
import ReactDOM from 'react-dom/client'
import { setStorage } from '@void-count/core'
import App from '@/App.jsx'
import '@/index.css'

// Install the browser's localStorage as the @void-count/core storage backend.
// Must happen before any core function that reads/writes persistent state.
setStorage(window.localStorage)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
