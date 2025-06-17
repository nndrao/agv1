import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/datatable/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import App from './App.tsx';
import './index.css';

// Mark app start
// perfMonitor.mark('app-start');

// Defer non-critical imports
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./components/datatable/stores/storageAnalyzer');
    import('./components/datatable/stores/migrateProfiles');
  });
} else {
  setTimeout(() => {
    import('./components/datatable/stores/storageAnalyzer');
    import('./components/datatable/stores/migrateProfiles');
  }, 1000);
}

const root = document.getElementById('root')!;
  // perfMonitor.mark('render-start');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" enableSystem>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);

    // perfMonitor.measureFromStart('firstRenderTime');