import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import App from './App.tsx';
import './index.css';
import { perfMonitor } from './lib/performance-monitor';

// Mark app start
perfMonitor.mark('app-start');

// Defer non-critical imports
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./stores/storage-analyzer');
    import('./stores/migrate-profiles');
    import('./lib/performance-test');
  });
} else {
  setTimeout(() => {
    import('./stores/storage-analyzer');
    import('./stores/migrate-profiles');
    import('./lib/performance-test');
  }, 1000);
}

const root = document.getElementById('root')!;
perfMonitor.mark('render-start');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" enableSystem>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);

perfMonitor.measureFromStart('firstRenderTime');