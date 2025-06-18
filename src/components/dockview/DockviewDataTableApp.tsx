import React from 'react';
import { DockviewDemo } from './DockviewDemo';
import './demo-styles.css';

/**
 * Main application component that integrates DataTable with Dockview
 * This can be used as the root component for the DataTable application
 */
export const DockviewDataTableApp: React.FC = () => {
  return <DockviewDemo />;
};

// Export for use in main App.tsx
export default DockviewDataTableApp;