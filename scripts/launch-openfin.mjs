import { launch } from '@openfin/node-adapter';
import http from 'http';

async function launchApp() {
  try {
    const manifestUrl = `http://localhost:5173/manifest.fin.json`;
    
    console.log('Launching AGV1 Workspace Platform...');
    console.log(`Manifest URL: ${manifestUrl}`);
    
    // Launch OpenFin with the manifest
    const fin = await launch({
      uuid: 'agv1-launcher',
      manifest: manifestUrl,
      runtime: {
        version: '41.102.4.3'
      }
    });
    
    console.log('AGV1 Workspace Platform launched successfully');
    
    // Listen for when the platform closes
    fin.once('disconnected', () => {
      console.log('Platform disconnected');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to launch AGV1 Workspace Platform:', error);
    process.exit(1);
  }
}

// Check if dev server is running
http.get('http://localhost:5173', (res) => {
  if (res.statusCode === 200 || res.statusCode === 304) {
    launchApp();
  }
}).on('error', () => {
  console.error('Please start the development server first: npm run dev');
  process.exit(1);
});