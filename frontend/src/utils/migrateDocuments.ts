// Utility to migrate existing documents to include originalFilename
import { DatabaseService } from '../services/database';
import { apiService } from '../services/api';

export async function migrateDocumentsWithOriginalFilename() {
  console.log('🔄 Starting document migration to add originalFilename...');
  
  try {
    // Get all documents from IndexedDB
    const localDocuments = await DatabaseService.getAllDocuments();
    console.log(`Found ${localDocuments.length} documents to check`);
    
    let migratedCount = 0;
    
    for (const doc of localDocuments) {
      // If document doesn't have originalFilename, try to get it from server
      if (!doc.originalFilename) {
        try {
          console.log(`Migrating document ${doc.id}...`);
          
          // Fetch fresh data from server
          const serverDoc = await apiService.getDocument(doc.id);
          
          if (serverDoc.originalFilename) {
            // Update the document in IndexedDB with originalFilename
            await DatabaseService.updateDocument(doc.id, {
              originalFilename: serverDoc.originalFilename,
              syncStatus: 'synced',
              lastSyncAt: new Date()
            });
            
            migratedCount++;
            console.log(`✅ Migrated ${doc.id}: ${serverDoc.originalFilename}`);
          } else {
            // Fallback: use filename as originalFilename
            await DatabaseService.updateDocument(doc.id, {
              originalFilename: doc.filename,
              syncStatus: 'synced',
              lastSyncAt: new Date()
            });
            
            migratedCount++;
            console.log(`⚠️ Fallback migration for ${doc.id}: ${doc.filename}`);
          }
        } catch (error) {
          console.error(`❌ Failed to migrate document ${doc.id}:`, error);
          
          // Fallback: use filename as originalFilename
          try {
            await DatabaseService.updateDocument(doc.id, {
              originalFilename: doc.filename,
              syncStatus: 'synced',
              lastSyncAt: new Date()
            });
            migratedCount++;
            console.log(`⚠️ Fallback migration for ${doc.id}: ${doc.filename}`);
          } catch (fallbackError) {
            console.error(`❌ Fallback migration also failed for ${doc.id}:`, fallbackError);
          }
        }
      } else {
        console.log(`✅ Document ${doc.id} already has originalFilename: ${doc.originalFilename}`);
      }
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} documents`);
    return { success: true, migratedCount };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run migration on app startup (can be called from main.tsx or App.tsx)
export async function autoMigrateOnStartup() {
  // Check if migration has already been run
  const migrationKey = 'documents_originalFilename_migrated';
  const alreadyMigrated = localStorage.getItem(migrationKey);
  
  if (!alreadyMigrated) {
    console.log('🚀 Running automatic document migration...');
    const result = await migrateDocumentsWithOriginalFilename();
    
    if (result.success) {
      localStorage.setItem(migrationKey, 'true');
      console.log('✅ Migration completed and marked as done');
    }
  } else {
    console.log('✅ Document migration already completed');
  }
}

// Manual migration function (can be called from browser console)
(window as any).migrateDocuments = migrateDocumentsWithOriginalFilename;