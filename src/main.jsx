import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from "@clerk/clerk-react"
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h1>Missing Clerk publishable key</h1>
        <p>
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in a <code>.env</code> file
          at the project root, then restart <code>npm run dev</code>.
        </p>
      </div>
    )}
  </React.StrictMode>
)