import React from 'react';

export const Logo: React.FC<{ variant?: 'full' | 'icon', className?: string }> = ({ variant = 'full', className = '' }) => {
  // Use a reliable free image placeholder (FlowThread text as fallback)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img 
          src="https://placehold.co/400x200/2D7AFF/white?text=FlowThread"
          alt="FlowThread"
          className="w-full max-w-[280px] h-auto"
        />
      </div>
    );
  }
  return (
    <img 
      src="https://placehold.co/32x32/2D7AFF/white?text=FT"
      alt="FlowThread"
      className="h-8 w-auto"
    />
  );
};
