import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const Spinner = ({ size = 'medium', color = '#000000', text }: SpinnerProps) => {
  const sizeMap = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-20 h-20',
  };

  const sizeClass = sizeMap[size];
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClass} border-4 border-gray-200 border-t-black rounded-full animate-spin`} 
           style={{ borderTopColor: color }}></div>
      {text && <p className="mt-6 text-gray-700 text-sm">{text}</p>}
    </div>
  );
};

export default Spinner; 