import React from 'react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-foreground/70">
        {title}
      </h3>
      <div className="pl-2">
        {children}
      </div>
    </div>
  );
};