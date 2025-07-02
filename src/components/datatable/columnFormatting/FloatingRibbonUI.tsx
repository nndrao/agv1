import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CustomHeader } from './components/custom/CustomHeader';
import { CustomTabs } from './components/custom/CustomTabs';
import { CustomContent } from './components/custom/CustomContent';
import { useRibbonState } from './hooks/useRibbonState';
import { ErrorBoundary, IsolatedErrorBoundary } from './components/ErrorBoundary';
import type { FloatingRibbonUIProps } from './types';
import './custom-styles.css';

export const FloatingRibbonUI: React.FC<FloatingRibbonUIProps> = ({ 
  targetColumn, 
  initialPosition,
  onClose,
  columnDefs,
  columnState,
  onApply
}) => {
  // Position and dragging state
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Log initialization for debugging - removed to reduce noise

  // Use the custom hook for all ribbon state and logic
  const ribbonState = useRibbonState({
    targetColumn,
    columnDefs,
    columnState, // Ensure columnState is properly passed
    onApply,
    onClose
  });

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header area
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[role="combobox"]')) {
      return;
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // Listen for custom header mouse down events
  useEffect(() => {
    const headerElement = dragRef.current?.querySelector('[data-header]');
    if (!headerElement) return;

    const handleHeaderMouseDown = (e: CustomEvent) => {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.detail.clientX - position.x,
        y: e.detail.clientY - position.y
      };
    };

    headerElement.addEventListener('headerMouseDown', handleHeaderMouseDown as EventListener);
    
    return () => {
      headerElement.removeEventListener('headerMouseDown', handleHeaderMouseDown as EventListener);
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 1000);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage after drag ends
      const currentPosition = { 
        x: dragRef.current?.offsetLeft || 0, 
        y: dragRef.current?.offsetTop || 0 
      };
      localStorage.setItem('floating-ribbon-position', JSON.stringify(currentPosition));
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Set cursor styles
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isDragging]); // Remove position from dependencies to prevent cleanup issues

  // Enhanced close handler with logging
  const handleClose = () => {
    console.log('[FloatingRibbonUI] Closing ribbon:', {
      hasPendingChanges: ribbonState.pendingChanges.size > 0,
      selectedColumnsCount: ribbonState.selectedColumns.size
    });
    onClose?.();
  };

  return (
    <Card 
      ref={dragRef}
      className={cn(
        "floating-ribbon fixed z-50",
        "rounded-lg overflow-hidden",
        "shadow-xl border-2 border-border",
        isDragging ? "ribbon-dragging" : ""
      )}
      style={{ 
        width: '900px', 
        maxWidth: '90vw',
        left: `${position.x}px`,
        top: `${position.y}px`,
        borderRadius: 'var(--ribbon-border-radius)',
        boxShadow: 'var(--ribbon-shadow)',
      }}
    >
      {/* Row 1: Header */}
      <div className="ribbon-header" data-header onMouseDown={handleMouseDown}>
        <IsolatedErrorBoundary componentName="Header">
          <CustomHeader
            selectedColumns={ribbonState.selectedColumns}
            columnDefinitions={ribbonState.columnDefinitions}
            hasChanges={ribbonState.pendingChanges.size > 0}
            onSelectionChange={ribbonState.setSelectedColumns}
            onApply={ribbonState.handleApply}
            onReset={ribbonState.handleReset}
            onClose={handleClose}
            onDragStart={handleMouseDown}
            onClearSelected={ribbonState.handleClearSelected}
          />
        </IsolatedErrorBoundary>
      </div>
      
      {/* Row 2: Tab Strip */}
      <div className="ribbon-tabs">
        <IsolatedErrorBoundary componentName="Tabs">
          <CustomTabs
            activeTab={ribbonState.activeTab}
            setActiveTab={ribbonState.setActiveTab}
            selectedColumns={ribbonState.selectedColumns}
          />
        </IsolatedErrorBoundary>
      </div>
      
      {/* Row 3: Dynamic Content */}
      <div className="ribbon-content">
        <ErrorBoundary 
          resetKeys={[ribbonState.activeTab]}
          resetOnPropsChange
          onError={(error, errorInfo) => {
            console.error('[FloatingRibbonUI] Content error:', error, errorInfo);
          }}
        >
          <CustomContent
            activeTab={ribbonState.activeTab}
            selectedColumns={ribbonState.selectedColumns}
            formatCategory={ribbonState.formatCategory}
            setFormatCategory={ribbonState.setFormatCategory}
            currentFormat={ribbonState.currentFormat}
            setCurrentFormat={ribbonState.setCurrentFormat}
            showConditionalDialog={ribbonState.showConditionalDialog}
            setShowConditionalDialog={ribbonState.setShowConditionalDialog}
            advancedFilterTab={ribbonState.advancedFilterTab}
            setAdvancedFilterTab={ribbonState.setAdvancedFilterTab}
          />
        </ErrorBoundary>
      </div>
    </Card>
  );
}; 