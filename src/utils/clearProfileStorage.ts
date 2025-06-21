/**
 * Utility to clear profile storage for testing
 */
export function clearProfileStorage() {
  console.log('Clearing profile storage...');
  
  // Remove profile storage
  localStorage.removeItem('grid-profile-storage');
  
  // Remove any other related storage
  localStorage.removeItem('column-dialog-sound-enabled');
  localStorage.removeItem('column-formatting-storage');
  
  console.log('Profile storage cleared');
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).clearProfileStorage = clearProfileStorage;
}