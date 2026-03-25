import React from 'react';

const Logo: React.FC<{ className?: string; showText?: boolean }> = ({ className = "", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/Gemini_Generated_Image_i.png" alt="FlowThread" className="h-8 w-auto" />
      {showText && <span className="font-semibold text-lg">FlowThread</span>}
    </div>
  );
};

export default Logo;
