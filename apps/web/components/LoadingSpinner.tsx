import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-ocean-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;