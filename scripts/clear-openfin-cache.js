const { exec } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🧹 Clearing OpenFin cache...');

// Get OpenFin cache directory
const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'OpenFin', 'cache');

// Kill any running OpenFin processes
exec('taskkill /F /IM OpenFin.exe /T 2>nul', (error) => {
  if (!error) {
    console.log('✅ Killed OpenFin processes');
  }
  
  // Clear the cache
  exec(`rmdir /s /q "${cacheDir}" 2>nul`, (error) => {
    if (!error) {
      console.log('✅ Cleared OpenFin cache');
    }
    
    console.log('🚀 You can now launch OpenFin fresh');
  });
});