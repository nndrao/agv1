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
    <div className={`property-group ${className}`}>
      <h3 className="section-header">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};