import React, { useState } from 'react';
import { format } from 'date-fns';
import type { Annotation } from '../contexts/AppContext';

interface EditAnnotationModalProps {
  annotation: Annotation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { content: string; color?: string }) => void;
  onDelete: () => void;
}

export const EditAnnotationModal: React.FC<EditAnnotationModalProps> = ({
  annotation,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [content, setContent] = useState(annotation.content);
  const [color, setColor] = useState(
    annotation.type === 'image' ? annotation.color || '#000000' : '#000000'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updates: { content: string; color?: string } = { content };
    
    // Only include color for image annotations
    if (annotation.type === 'image') {
      updates.color = color;
    }
    
    onSave(updates);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setContent(annotation.content);
    setColor(annotation.type === 'image' ? annotation.color || '#000000' : '#000000');
    setShowDeleteConfirm(false);
    onClose();
  };

  const formattedTimestamp = format(
    new Date(annotation.createdAt),
    'MMM dd, yyyy – h:mm a'
  );

  // Default creator name
  const creatorName = 'User';

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Annotation
            </h2>
          </div>

          {/* Modal body */}
          <div className="px-6 py-4 space-y-4">
            {/* Creator name (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creator
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                {creatorName}
              </div>
            </div>

            {/* Timestamp (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                {formattedTimestamp}
              </div>
            </div>

            {/* Content text area */}
            <div>
              <label
                htmlFor="annotation-content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content
              </label>
              <textarea
                id="annotation-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
                placeholder="Enter annotation content..."
              />
            </div>

            {/* Color picker (only for image annotations) */}
            {annotation.type === 'image' && (
              <div>
                <label
                  htmlFor="annotation-color"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Marker Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="annotation-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 font-mono">
                    {color.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            {/* Delete button */}
            <div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Are you sure?
                  </span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Save and Cancel buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
