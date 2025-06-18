import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/datatable/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import App from './App-Dockview.tsx';
import './index.css';

// Use the Dockview version of the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" enableSystem>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);