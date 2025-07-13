/**
 * Creates SVG icons for OpenFin dock
 * Note: OpenFin dock might require actual URLs, not data URLs
 */

/**
 * Creates a data URL from an SVG string
 */
function createIconDataUrl(svgString: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}

/**
 * Get icon URL - returns actual HTTP URLs for dock compatibility
 */
export function getHttpIconUrl(iconName: string): string {
  // Map icon names to actual HTTP URLs
  // In production, these would be served from your server
  const iconMap: Record<string, string> = {
    newDataTable: 'http://localhost:5173/icons/plus.svg',
    dataSources: 'http://localhost:5173/icons/database.svg', 
    profiles: 'http://localhost:5173/icons/user.svg',
    settings: 'http://localhost:5173/icons/settings.svg',
    mainApp: 'http://localhost:5173/icons/table.svg'
  };
  
  return iconMap[iconName] || 'http://localhost:5173/vite.svg';
}

/**
 * SVG icon strings with proper styling for dock visibility
 */
const iconSvgs = {
  // Plus icon for New DataTable
  newDataTable: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>`,
  
  // Database icon for Data Sources
  dataSources: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>`,
  
  // User icon for Profiles
  profiles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>`,
  
  // Settings icon
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6m4.22-10.22l4.24 4.24M6.34 7.76L2.1 3.52m17.8 17.8l-4.24-4.24M7.76 17.66L3.52 21.9m10.22-4.22l4.24 4.24M7.76 6.34L3.52 2.1m17.8 17.8l-4.24-4.24M17.66 7.76L21.9 3.52"></path>
  </svg>`,
  
  // Table icon for main app
  mainApp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
  </svg>`,
  
  // Folder icon for workspace
  workspace: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>`,
  
  // Cable icon for connections
  connections: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"></path>
    <path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"></path>
    <path d="M3 5v2a1 1 0 0 0 1 1h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1"></path>
  </svg>`,
  
  // Download icon for import/export
  importExport: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>`
};

/**
 * Pre-generated dock icons for better performance
 */
export const dockIcons = Object.entries(iconSvgs).reduce((acc, [key, svg]) => {
  acc[key as keyof typeof iconSvgs] = createIconDataUrl(svg);
  return acc;
}, {} as Record<keyof typeof iconSvgs, string>);

/**
 * Get icon URL for dock button
 */
export function getDockIcon(name: keyof typeof dockIcons): string {
  // For dock, use HTTP URLs instead of data URLs
  return getHttpIconUrl(name);
}