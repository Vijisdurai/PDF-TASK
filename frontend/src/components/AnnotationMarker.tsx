import React from 'react';

interface AnnotationMarkerProps {
  number: number;
  color?: string; // Hex color code (default: #000000)
  position: { x: number; y: number }; // Screen coordinates
  onClick: () => void;
  isHighlighted?: boolean;
}

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.0 formula
 */
const calculateLuminance = (hexColor: string): number => {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Determine if text should be black or white based on background color
 */
const getTextColor = (backgroundColor: string): string => {
  // If background is white, use black text
  if (backgroundColor.toUpperCase() === '#FFFFFF' || backgroundColor.toUpperCase() === '#FFF') {
    return '#000000';
  }

  // Calculate luminance and use black text for high luminance backgrounds
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.9 ? '#000000' : '#FFFFFF';
};

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  number,
  color = '#000000',
  position,
  onClick,
  isHighlighted = false
}) => {
  const textColor = getTextColor(color);

  return (
    <div
      className="absolute cursor-pointer transition-transform duration-200 hover:scale-110"
      style={{
        left: position.x - 12, // Center the 24px marker
        top: position.y - 12,
        width: '24px',
        height: '24px',
        zIndex: isHighlighted ? 20 : 10
      }}
      onClick={onClick}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center shadow-md"
        style={{
          backgroundColor: color,
          transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <span
          className="text-xs font-bold select-none"
          style={{ color: textColor }}
        >
          {number}
        </span>
      </div>
    </div>
  );
};

export default AnnotationMarker;