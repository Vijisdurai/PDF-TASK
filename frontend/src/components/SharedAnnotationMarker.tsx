/**
 * SharedAnnotationMarker Component
 * 
 * A reusable annotation marker component with customizable styling
 * Can be used for both document and image annotations
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface SharedAnnotationMarkerProps {
  id: string;
  x: number; // Screen coordinate
  y: number; // Screen coordinate
  content?: string;
  color?: string; // Hex color code (for image annotations)
  isSelected?: boolean;
  isHovered?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onHover?: (isHovered: boolean) => void;
  variant?: 'document' | 'image'; // Visual variant
  size?: 'small' | 'medium' | 'large';
}

const SharedAnnotationMarker: React.FC<SharedAnnotationMarkerProps> = ({
  id,
  x,
  y,
  content,
  color,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  variant = 'document',
  size = 'medium'
}) => {
  // Size configurations
  const sizeConfig = {
    small: { marker: 12, offset: 6, ring: 16 },
    medium: { marker: 16, offset: 8, ring: 20 },
    large: { marker: 20, offset: 10, ring: 24 }
  };
  
  const { marker: markerSize, offset, ring: ringSize } = sizeConfig[size];
  
  // Color configuration
  const markerColor = color || (variant === 'image' ? '#FFEB3B' : '#2196F3');
  const borderColor = color ? `${color}CC` : (variant === 'image' ? '#F9A825' : '#1976D2');
  
  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: x - offset,
        top: y - offset,
        transform: 'translate(0, 0)',
        zIndex: isSelected ? 30 : 20
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
          className="absolute rounded-full"
          style={{
            inset: `-${(ringSize - markerSize) / 2}px`,
            width: ringSize,
            height: ringSize,
            border: `2px solid ${markerColor}`,
            opacity: 0.6
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Main marker */}
      <div
        className="rounded-full shadow-lg cursor-pointer transition-all duration-200"
        style={{
          width: markerSize,
          height: markerSize,
          backgroundColor: markerColor,
          border: `2px solid ${borderColor}`,
          ...(isSelected && {
            boxShadow: `0 0 0 2px ${markerColor}40`
          })
        }}
        onClick={onClick}
        title={content || 'Click to view annotation'}
      >
        {/* Inner dot for better visibility */}
        <div 
          className="rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: markerSize / 4,
            height: markerSize / 4,
            backgroundColor: variant === 'image' ? '#000' : '#FFF'
          }}
        />
        
        {/* Pulse animation for new markers */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: markerSize,
            height: markerSize,
            backgroundColor: markerColor
          }}
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
          <div 
            className="backdrop-blur-sm text-xs font-medium px-3 py-2 rounded-lg border-2 shadow-xl max-w-xs"
            style={{
              backgroundColor: variant === 'image' ? `${markerColor}F0` : '#1E293BF0',
              borderColor: borderColor,
              color: variant === 'image' ? '#000' : '#FFF'
            }}
          >
            <div className="line-clamp-3">{content}</div>
            {/* Tooltip arrow */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${borderColor}`
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SharedAnnotationMarker;
