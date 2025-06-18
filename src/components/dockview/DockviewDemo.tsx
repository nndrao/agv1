import React, { useState, useEffect } from 'react';
import { DockviewContainer } from './DockviewContainer';

export const DockviewDemo: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check if dark mode is set in localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="demo-container">
      <div className="dockview-demo-container">
        <DockviewContainer
          darkMode={darkMode}
          onPanelCountChange={() => {}}
        />
      </div>
    </div>
  );
};