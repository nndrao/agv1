import React from 'react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        {title}
      </h3>
      <div className="pl-3">
        {children}
      </div>
    </div>
  );
};