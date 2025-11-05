import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Edit3, Trash2 } from 'lucide-react';

interface AnnotationInputProps {
  isOpen: boolean;
  x: number; // Screen coordinate for positioning
  y: number; // Screen coordinate for positioning
  initialContent?: string;
  isEditing?: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  maxLength?: number;
}

const AnnotationInput: React.FC<AnnotationInputProps> = ({
  isOpen,
  x,
  y,
  initialContent = '',
  isEditing = false,
  onSave,
  onCancel,
  onDelete,
  maxLength = 500
}) => {
  const [content, setContent] = useState(initialContent);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus textarea when component opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isOpen]);

  // Reset content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Handle save action
  const handleSave = useCallback(() => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSave(trimmedContent);
    } else {
      onCancel();
    }
  }, [content, onSave, onCancel]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    setContent(initialContent);
    setIsExpanded(false);
    onCancel();
  }, [initialContent, onCancel]);

  // Handle delete action
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete();
    }
  }, [onDelete]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Calculate optimal positioning to keep popover in viewport
  const getPopoverPosition = useCallback(() => {
    if (!containerRef.current) return { x, y };

    const popoverWidth = 280;
    const popoverHeight = isExpanded ? 200 : 120;
    const margin = 16;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + popoverWidth + margin > viewportWidth) {
      adjustedX = x - popoverWidth - margin;
    }
    if (adjustedX < margin) {
      adjustedX = margin;
    }

    // Adjust vertical position
    if (y + popoverHeight + margin > viewportHeight) {
      adjustedY = y - popoverHeight - margin;
    }
    if (adjustedY < margin) {
      adjustedY = margin;
    }

    return { x: adjustedX, y: adjustedY };
  }, [x, y, isExpanded]);

  const position = getPopoverPosition();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed z-50 pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
        }}
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          duration: 0.3
        }}
      >
        {/* Backdrop blur overlay */}
        <div className="absolute inset-0 bg-navy-900/20 backdrop-blur-sm rounded-lg -m-2" />
        
        {/* Main popover content */}
        <div className="relative bg-navy-800 border border-navy-600 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Edit3 size={16} className="text-ocean-blue" />
              <span className="text-sm font-medium text-off-white">
                {isEditing ? 'Edit Annotation' : 'New Annotation'}
              </span>
            </div>
            
            {/* Expand/collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-off-white transition-colors p-1 rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ↕
              </motion.div>
            </button>
          </div>

          {/* Content input */}
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your annotation..."
              className={`
                w-full bg-navy-700 border border-navy-600 rounded text-off-white placeholder-gray-400
                focus:border-ocean-blue focus:ring-1 focus:ring-ocean-blue focus:outline-none
                resize-none transition-all duration-200 p-2 text-sm
                ${isExpanded ? 'min-h-[100px]' : 'min-h-[60px]'}
              `}
              maxLength={maxLength}
              rows={isExpanded ? 5 : 3}
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>
                {content.length}/{maxLength} characters
              </span>
              <span className="text-gray-500">
                Ctrl+Enter to save, Esc to cancel
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {/* Save button */}
              <motion.button
                onClick={handleSave}
                disabled={!content.trim()}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-all duration-200
                  ${content.trim()
                    ? 'bg-ocean-blue text-off-white hover:bg-ocean-blue/80 shadow-md hover:shadow-lg'
                    : 'bg-navy-600 text-gray-400 cursor-not-allowed'
                  }
                `}
                whileHover={content.trim() ? { scale: 1.02 } : {}}
                whileTap={content.trim() ? { scale: 0.98 } : {}}
              >
                <Save size={14} />
                <span>Save</span>
              </motion.button>

              {/* Cancel button */}
              <motion.button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium bg-navy-600 text-gray-300 hover:bg-navy-500 hover:text-off-white transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X size={14} />
                <span>Cancel</span>
              </motion.button>
            </div>

            {/* Delete button (only show when editing) */}
            {isEditing && onDelete && (
              <motion.button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Delete annotation"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </motion.button>
            )}
          </div>

          {/* Popover arrow */}
          <div 
            className="absolute w-3 h-3 bg-navy-800 border-l border-t border-navy-600 transform rotate-45"
            style={{
              left: Math.min(Math.max(x - position.x - 6, 12), 268), // Clamp arrow position
              top: y < position.y ? '100%' : '-6px', // Arrow on top or bottom
              marginTop: y < position.y ? '-1px' : '0',
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnotationInput;