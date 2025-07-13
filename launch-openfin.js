/**
 * Launch script for OpenFin AGV1 application
 * Run with: node launch-openfin.js
 */

const { launch } = require('@openfin/node-adapter');

async function launchApp() {
  try {
    console.log('🚀 Launching AGV1 OpenFin application...');
    
    // Use the manifest.fin.json file instead of inline config
    const manifestUrl = 'http://localhost:5173/manifest.fin.json';
    
    console.log('📋 Using manifest:', manifestUrl);
    
    const port = await launch({
      manifestUrl,
      devtools_port: 9090
    });
    
    console.log(`✅ OpenFin launched successfully on port ${port}`);
    console.log('🔧 DevTools available at: http://localhost:9090');
    console.log('');
    console.log('📝 To test the dock buttons:');
    console.log('1. Open DevTools for the provider window');
    console.log('2. Check console for initialization logs');
    console.log('3. Run: testDockButtons()');
    console.log('');
    console.log('Press Ctrl+C to stop the application');
    
  } catch (error) {
    console.error('❌ Failed to launch OpenFin:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down OpenFin...');
  process.exit(0);
});

// Launch the app
launchApp();