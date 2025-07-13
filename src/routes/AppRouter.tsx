import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import { DataTableStandalone } from '@/components/datatable/DataTableStandalone';
import { ProfileManagerV2 } from '@/components/datatable/ProfileManagerV2';
import { ImportExportDialog } from '@/components/settings/ImportExportDialog';
import { HeadlessProviderRoute } from '@/components/provider/HeadlessDataProvider';
import { DatasourceConfigDialog } from '@/components/config/DatasourceConfigDialog';

// OpenFin Provider Component (minimal UI)
const OpenFinProvider: React.FC = () => {
  const [status, setStatus] = React.useState<'initializing' | 'ready' | 'error'>('initializing');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('🎯 OpenFinProvider component mounted');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('🔍 OpenFin available:', typeof fin !== 'undefined');
    
    // Only initialize if we're in OpenFin and this is the provider window
    if (typeof fin !== 'undefined' && window.location.pathname === '/provider') {
      console.log('🚀 Starting OpenFin platform initialization...');
      import('@/openfin/provider/provider')
        .then(({ initializePlatform }) => {
          console.log('📦 Provider module loaded, calling initializePlatform...');
          return initializePlatform();
        })
        .then(() => {
          console.log('✅ Platform initialized successfully');
          setStatus('ready');
        })
        .catch((err) => {
          console.error('❌ Failed to initialize workspace platform:', err);
          setError(err.message);
          setStatus('error');
        });
    } else {
      console.warn('⚠️ Not initializing platform:', {
        hasOpenFin: typeof fin !== 'undefined',
        pathname: window.location.pathname
      });
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#1e1f23',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>AGV1 Workspace Platform</h1>
        {status === 'initializing' && <p>Initializing provider...</p>}
        {status === 'ready' && <p>Provider is running</p>}
        {status === 'error' && (
          <>
            <p style={{ color: '#f44336' }}>Failed to initialize platform</p>
            <p style={{ fontSize: '0.9em', opacity: 0.8 }}>{error}</p>
          </>
        )}
      </div>
    </div>
  );
};

// DataTable Route Component
const DataTableRoute: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const channelName = searchParams.get('channel');
  const theme = searchParams.get('theme');

  return (
    <DataTableStandalone
      key={tableId}
      tableId={tableId || 'default'}
      channelName={channelName || undefined}
      initialConfig={{
        theme: theme || undefined
      }}
    />
  );
};

// Profile Manager Route Component
const ProfileManagerRoute: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Profile Management</h1>
      <ProfileManagerV2 />
    </div>
  );
};

// Settings Import/Export Route Component
const SettingsRoute: React.FC = () => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    // In OpenFin, we might want to close the window
    if (typeof fin !== 'undefined') {
      fin.Window.getCurrentSync().close();
    } else {
      window.history.back();
    }
  };

  return (
    <ImportExportDialog
      open={open}
      onOpenChange={setOpen}
      onClose={handleClose}
    />
  );
};

// Create the router
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/datatable/default" replace />,
  },
  {
    path: '/provider',
    element: <OpenFinProvider />,
  },
  {
    path: '/provider/headless',
    element: <HeadlessProviderRoute />,
  },
  {
    path: '/datatable/:tableId',
    element: <DataTableRoute />,
  },
  {
    path: '/profiles',
    element: <ProfileManagerRoute />,
  },
  {
    path: '/settings/import-export',
    element: <SettingsRoute />,
  },
  {
    path: '/datasources',
    element: <DatasourceConfigDialog />,
  },
]);

// Router Provider Component
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};