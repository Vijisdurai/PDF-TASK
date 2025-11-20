import React from 'react';
import { motion } from 'framer-motion';

interface AnnotationMarkerProps {
  id: string;
  x: number; // Screen coordinate
  y: number; // Screen coordinate
  content?: string;
  number?: number; // Annotation number (1, 2, 3, etc.)
  isSelected?: boolean;
  isHovered?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onHover?: (isHovered: boolean) => void;
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  id,
  x,
  y,
  content,
  number,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover
}) => {
  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: x - 12, // Center the 24px marker
        top: y - 12,
        transform: 'translate(0, 0)', // Prevent transform interference
        zIndex: isSelected ? 20 : 10 // Selected markers appear on top
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.3 : isHovered ? 1.2 : 1, 
        opacity: 1 
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.3
      }}
      whileHover={{ scale: isSelected ? 1.4 : 1.2 }}
      whileTap={{ scale: 0.9 }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Outer ring for selected state */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 w-6 h-6 -m-1 border-2 border-ocean-blue rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Main marker */}
      <div
        className={`
          w-6 h-6 rounded-full shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center
          ${isSelected 
            ? 'bg-ocean-500 border-2 border-off-white ring-2 ring-ocean-blue/30' 
            : 'bg-ocean-500 border-2 border-off-white hover:bg-ocean-400'
          }
        `}
        onClick={onClick}
        title={content || 'Click to view annotation'}
      >
        {/* Number display */}
        {number !== undefined && (
          <span className="text-white text-xs font-bold leading-none select-none">
            {number}
          </span>
        )}
        
        {/* Pulse animation for new markers */}
        <motion.div
          className="absolute inset-0 w-6 h-6 bg-ocean-500 rounded-full -z-10"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ 
            duration: 1.5, 
            repeat: 2,
            ease: "easeOut"
          }}
        />
      </div>
      
      {/* Hover tooltip */}
      {isHovered && content && (
        <motion.div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-navy-900/95 backdrop-blur-sm text-off-white text-xs px-2 py-1 rounded border border-navy-700 shadow-lg max-w-48">
            <div className="truncate">{content}</div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-navy-700" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnnotationMarker;