import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeDatabase } from '@/services/database'
import { autoMigrateOnStartup } from '@/utils/migrateDocuments'

// Render app immediately
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize database and run migrations in the background
initializeDatabase()
  .then(async () => {
    console.log('✅ Database initialized');
    // Run document migration to ensure originalFilename is present
    await autoMigrateOnStartup();
    console.log('✅ Migration complete');
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
  })
