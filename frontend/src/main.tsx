import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeDatabase } from './services/database'
import { autoMigrateOnStartup } from './utils/migrateDocuments'

// Initialize database and run migrations before rendering the app
initializeDatabase()
  .then(async () => {
    // Run document migration to ensure originalFilename is present
    await autoMigrateOnStartup();
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize application:', error)
    // Render app anyway with error state
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <div className="flex items-center justify-center min-h-screen bg-navy-900 text-off-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Database Initialization Error</h1>
            <p className="text-gray-300">Failed to initialize the local database. Please refresh the page.</p>
          </div>
        </div>
      </StrictMode>,
    )
  })
