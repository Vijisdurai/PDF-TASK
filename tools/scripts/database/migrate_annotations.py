"""
Migration script to add new fields to annotations table
This script adds annotation_type, x_pixel, y_pixel, and color fields
"""
import sqlite3
import os
from pathlib import Path

def migrate_annotations_table(db_path: str):
    """
    Migrate the annotations table to support both document and image annotations
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if migration is needed
        cursor.execute("PRAGMA table_info(annotations)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'annotation_type' in columns:
            print("Migration already applied. Skipping.")
            return
        
        print("Starting migration...")
        
        # Step 1: Create new table with updated schema
        cursor.execute("""
            CREATE TABLE annotations_new (
                id VARCHAR(36) PRIMARY KEY,
                document_id VARCHAR(36) NOT NULL,
                annotation_type VARCHAR(20) NOT NULL DEFAULT 'document',
                page INTEGER,
                x_percent DECIMAL(5, 2),
                y_percent DECIMAL(5, 2),
                x_pixel INTEGER,
                y_pixel INTEGER,
                content TEXT NOT NULL,
                color VARCHAR(7),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                CHECK (
                    (annotation_type = 'document' AND page IS NOT NULL AND x_percent IS NOT NULL AND y_percent IS NOT NULL) OR
                    (annotation_type = 'image' AND x_pixel IS NOT NULL AND y_pixel IS NOT NULL)
                )
            )
        """)
        
        # Step 2: Copy existing data (all existing annotations are document type)
        cursor.execute("""
            INSERT INTO annotations_new 
                (id, document_id, annotation_type, page, x_percent, y_percent, content, created_at, updated_at)
            SELECT 
                id, document_id, 'document', page, x_percent, y_percent, content, created_at, updated_at
            FROM annotations
        """)
        
        # Step 3: Drop old table
        cursor.execute("DROP TABLE annotations")
        
        # Step 4: Rename new table
        cursor.execute("ALTER TABLE annotations_new RENAME TO annotations")
        
        # Step 5: Create indexes
        cursor.execute("CREATE INDEX idx_annotations_document_page ON annotations(document_id, page)")
        cursor.execute("CREATE INDEX idx_annotations_document_type ON annotations(document_id, annotation_type)")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    # Get database path from environment or use default
    db_path = os.getenv("DATABASE_PATH", "annotations.db")
    
    # Ensure the path exists
    if not Path(db_path).exists():
        print(f"Database not found at {db_path}")
        print("Creating new database with updated schema...")
        # The database will be created with the new schema when the app starts
    else:
        print(f"Migrating database at {db_path}")
        migrate_annotations_table(db_path)
