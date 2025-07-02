import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronRight, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './AppSidebar';
import { WorkspaceProvider } from './WorkspaceContext';
// import { useWorkspaceStore } from './stores/workspace.store';
import { DatasourceProvider } from '@/contexts/DatasourceContext';
import { DatasourceList } from '@/components/datasource/DatasourceList';

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  // Load pin state from localStorage
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    return saved === 'true';
  });
  const [sidebarVisible, setSidebarVisible] = useState(sidebarPinned);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [showDatasourceList, setShowDatasourceList] = useState(false);
  // const { activeWorkspace } = useWorkspaceStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();


  // Toggle pin state
  const togglePin = useCallback(() => {
    const newPinned = !sidebarPinned;
    setSidebarPinned(newPinned);
    localStorage.setItem('sidebar-pinned', String(newPinned));
    if (newPinned) {
      setSidebarVisible(true);
    }
  }, [sidebarPinned]);

  const toggleMobileSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Handle mouse enter on pill
  const handlePillMouseEnter = useCallback(() => {
    if (!sidebarPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setSidebarVisible(true);
      }, 300); // Small delay to prevent accidental triggers
    }
  }, [sidebarPinned]);

  // Handle mouse leave from pill
  const handlePillMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  // Handle mouse leave from sidebar
  const handleSidebarMouseLeave = useCallback(() => {
    if (!sidebarPinned) {
      setSidebarVisible(false);
    }
  }, [sidebarPinned]);

  // Keep sidebar visible when hovering over it
  const handleSidebarMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DatasourceProvider>
      <WorkspaceProvider>
        <div className="h-screen w-screen flex bg-background overflow-hidden relative">
        {/* Hover Pill - Only visible on desktop when sidebar is not pinned */}
        <div
          ref={pillRef}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300",
            "hidden lg:flex",
            sidebarPinned || sidebarVisible ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          onMouseEnter={handlePillMouseEnter}
          onMouseLeave={handlePillMouseLeave}
        >
          <div className="bg-primary/10 hover:bg-primary/20 rounded-r-full py-8 px-1 cursor-pointer transition-all duration-200 hover:px-2">
            <ChevronRight className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside
          ref={sidebarRef}
          className={cn(
            "absolute left-0 top-0 h-full bg-card border-r z-50 transition-all duration-300 ease-in-out shadow-lg",
            "hidden lg:block",
            sidebarVisible || sidebarPinned ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ width: '16rem' }}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold">AGV1</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePin}
                className="h-8 w-8"
                title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {sidebarPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            </div>

            {/* Sidebar Content */}
            <AppSidebar collapsed={false} onDatasourceClick={() => setShowDatasourceList(true)} />
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold">AGV1</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSidebar}
                className="h-8 w-8"
              >
                <X />
              </Button>
            </div>

            {/* Mobile Sidebar Content */}
            <AppSidebar 
              collapsed={false} 
              onItemClick={toggleMobileSidebar} 
              onDatasourceClick={() => {
                setShowDatasourceList(true);
                toggleMobileSidebar();
              }}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <div 
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300",
            sidebarPinned ? "lg:ml-64" : "ml-0"
          )}
        >
          {/* Mobile Menu Button - Floating */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            className="lg:hidden fixed top-4 left-4 z-30 bg-background border shadow-sm"
          >
            <ChevronRight />
          </Button>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
        
        {/* Datasource List Dialog */}
        <DatasourceList
          open={showDatasourceList}
          onOpenChange={setShowDatasourceList}
        />
      </div>
      </WorkspaceProvider>
    </DatasourceProvider>
  );
};