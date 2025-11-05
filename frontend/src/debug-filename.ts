// Simple debug script to check filename rendering
import { DatabaseService } from './services/database';

async function debugFilenames() {
  console.log('=== Debugging Filename Display ===');
  
  try {
    // Get all documents from IndexedDB
    const documents = await DatabaseService.getAllDocuments();
    console.log('Documents from IndexedDB:', documents);
    
    // Check each document's filename fields
    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log('  ID:', doc.id);
      console.log('  filename:', doc.filename);
      console.log('  originalFilename:', doc.originalFilename);
      console.log('  Display name would be:', doc.originalFilename || doc.filename);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error debugging filenames:', error);
  }
}

// Export for use in browser console
(window as any).debugFilenames = debugFilenames;

export default debugFilenames;