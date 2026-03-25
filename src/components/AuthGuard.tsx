import React from 'react';

export const Logo: React.FC<{ variant?: 'full' | 'icon', className?: string }> = ({ variant = 'full', className = '' }) => {
  if (variant === 'full') {
    return (
      <img 
        src="/Gemini_Generated_Image_i.png" 
        alt="FlowThread" 
        className={className}
      />
    );
  }
  // For icon variant (optional)
  return (
    <img 
      src="/Gemini_Generated_Image_i.png" 
      alt="FlowThread" 
      className="h-8 w-auto"
    />
  );
};
