/**
 * Annotation validation utilities
 * Provides validation logic for annotation data
 */

import type { DocumentAnnotation, ImageAnnotation, Annotation } from '../contexts/AppContext';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate document annotation data
 */
export function validateDocumentAnnotation(
  annotation: Partial<DocumentAnnotation>
): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!annotation.documentId) {
    errors.push('Document ID is required');
  }
  
  if (!annotation.content || annotation.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (annotation.content && annotation.content.length > 5000) {
    errors.push('Content must be less than 5000 characters');
  }
  
  if (typeof annotation.page !== 'number' || annotation.page < 1) {
    errors.push('Valid page number is required');
  }
  
  // Validate percentage coordinates
  if (typeof annotation.xPercent !== 'number' || 
      annotation.xPercent < 0 || 
      annotation.xPercent > 100) {
    errors.push('X coordinate must be between 0 and 100');
  }
  
  if (typeof annotation.yPercent !== 'number' || 
      annotation.yPercent < 0 || 
      annotation.yPercent > 100) {
    errors.push('Y coordinate must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate image annotation data
 */
export function validateImageAnnotation(
  annotation: Partial<ImageAnnotation>,
  imageWidth?: number,
  imageHeight?: number
): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!annotation.documentId) {
    errors.push('Document ID is required');
  }
  
  if (!annotation.content || annotation.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (annotation.content && annotation.content.length > 5000) {
    errors.push('Content must be less than 5000 characters');
  }
  
  // Validate pixel coordinates
  if (typeof annotation.xPixel !== 'number') {
    errors.push('X pixel coordinate is required');
  } else if (imageWidth !== undefined && (annotation.xPixel < 0 || annotation.xPixel > imageWidth)) {
    errors.push(`X coordinate must be between 0 and ${imageWidth}`);
  }
  
  if (typeof annotation.yPixel !== 'number') {
    errors.push('Y pixel coordinate is required');
  } else if (imageHeight !== undefined && (annotation.yPixel < 0 || annotation.yPixel > imageHeight)) {
    errors.push(`Y coordinate must be between 0 and ${imageHeight}`);
  }
  
  // Validate color if provided
  if (annotation.color) {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(annotation.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FFEB3B)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate annotation based on type
 */
export function validateAnnotation(
  annotation: Partial<Annotation>,
  imageWidth?: number,
  imageHeight?: number
): ValidationResult {
  if (!annotation.type) {
    return {
      isValid: false,
      errors: ['Annotation type is required']
    };
  }
  
  if (annotation.type === 'document') {
    return validateDocumentAnnotation(annotation as Partial<DocumentAnnotation>);
  } else if (annotation.type === 'image') {
    return validateImageAnnotation(annotation as Partial<ImageAnnotation>, imageWidth, imageHeight);
  }
  
  return {
    isValid: false,
    errors: ['Invalid annotation type']
  };
}

/**
 * Sanitize annotation content to prevent XSS
 */
export function sanitizeContent(content: string): string {
  // Remove any HTML tags
  const withoutTags = content.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  const trimmed = withoutTags.trim();
  
  // Limit length
  return trimmed.slice(0, 5000);
}

/**
 * Validate hex color code
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
}

/**
 * Normalize hex color to uppercase format
 */
export function normalizeHexColor(color: string): string {
  if (!isValidHexColor(color)) {
    return '#FFEB3B'; // Default yellow
  }
  return color.toUpperCase();
}
