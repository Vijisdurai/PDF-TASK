-- Migration: Add annotation type support (document vs image)
-- Date: 2024-01-01
-- Description: Extends the annotations table to support both document (page-based) 
--              and image (pixel-based) annotations with proper constraints and indexes

-- Note: This migration is for documentation purposes only.
-- The actual schema is managed by SQLAlchemy and created via Base.metadata.create_all()

-- Add new columns to annotations table
-- ALTER TABLE annotations ADD COLUMN annotation_type VARCHAR(20) NOT NULL DEFAULT 'document';
-- ALTER TABLE annotations ADD COLUMN x_pixel INTEGER;
-- ALTER TABLE annotations ADD COLUMN y_pixel INTEGER;
-- ALTER TABLE annotations ADD COLUMN color VARCHAR(7);

-- Add CHECK constraint to ensure correct fields are populated based on annotation_type
-- ALTER TABLE annotations ADD CONSTRAINT check_annotation_type_fields CHECK (
--     (annotation_type = 'document' AND page IS NOT NULL AND x_percent IS NOT NULL AND y_percent IS NOT NULL) OR
--     (annotation_type = 'image' AND x_pixel IS NOT NULL AND y_pixel IS NOT NULL)
-- );

-- Create indexes for efficient querying
-- CREATE INDEX idx_annotations_document_page ON annotations(document_id, page);
-- CREATE INDEX idx_annotations_document_type ON annotations(document_id, annotation_type);

-- Current schema (as created by SQLAlchemy):
/*
CREATE TABLE annotations (
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
);

CREATE INDEX idx_annotations_document_page ON annotations(document_id, page);
CREATE INDEX idx_annotations_document_type ON annotations(document_id, annotation_type);
*/
