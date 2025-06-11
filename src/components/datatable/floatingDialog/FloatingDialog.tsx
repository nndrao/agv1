import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './floating-dialog-styles.css';

export interface FloatingDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  maximizable?: boolean;
  className?: string;
  contentClassName?: string;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  zIndex?: number;
}

export const FloatingDialog: React.FC<FloatingDialogProps> = ({
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  minWidth = 400,
  minHeight = 300,
  maxWidth,
  maxHeight,
  resizable = true,
  maximizable = true,
  className,
  contentClassName,
  onPositionChange,
  onSizeChange,
  zIndex = 1000,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState({ position, size });
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`floating-dialog-${title}`);
    if (savedState) {
      try {
        const { position: savedPos, size: savedSize } = JSON.parse(savedState);
        if (savedPos) setPosition(savedPos);
        if (savedSize) setSize(savedSize);
      } catch (e) {
        console.error('Failed to load dialog state:', e);
      }
    }
  }, [title]);

  // Save position and size to localStorage
  useEffect(() => {
    if (!isMaximized) {
      const state = { position, size };
      localStorage.setItem(`floating-dialog-${title}`, JSON.stringify(state));
    }
  }, [position, size, title, isMaximized]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position, isMaximized]);

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      // Keep dialog within viewport bounds
      const maxX = window.innerWidth - (dialogRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (dialogRef.current?.offsetHeight || 0);

      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: boundedX, y: boundedY });
      onPositionChange?.({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!resizable || isMaximized) return;
    
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size, resizable, isMaximized]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width + deltaX;
      let newHeight = resizeStartPos.current.height + deltaY;

      // Apply size constraints
      newWidth = Math.max(minWidth, newWidth);
      newHeight = Math.max(minHeight, newHeight);
      
      if (maxWidth) newWidth = Math.min(maxWidth, newWidth);
      if (maxHeight) newHeight = Math.min(maxHeight, newHeight);

      // Keep within viewport
      const maxViewportWidth = window.innerWidth - position.x;
      const maxViewportHeight = window.innerHeight - position.y;
      newWidth = Math.min(newWidth, maxViewportWidth);
      newHeight = Math.min(newHeight, maxViewportHeight);

      setSize({ width: newWidth, height: newHeight });
      onSizeChange?.({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position, minWidth, minHeight, maxWidth, maxHeight, onSizeChange]);

  // Handle maximize/restore
  const handleToggleMaximize = useCallback(() => {
    if (!maximizable) return;

    if (isMaximized) {
      // Restore
      setPosition(preMaximizeState.position);
      setSize(preMaximizeState.size);
      setIsMaximized(false);
    } else {
      // Maximize
      setPreMaximizeState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  }, [isMaximized, maximizable, position, size, preMaximizeState]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Card
      ref={dialogRef}
      className={cn(
        'floating-dialog',
        isDragging && 'floating-dialog-dragging',
        isResizing && 'floating-dialog-resizing',
        isMaximized && 'floating-dialog-maximized',
        className
      )}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
    >
      {/* Header */}
      <div
        className="floating-dialog-header"
        onMouseDown={handleDragStart}
      >
        <div className="floating-dialog-drag-handle">
          <GripHorizontal className="h-4 w-4" />
        </div>
        <h3 className="floating-dialog-title">{title}</h3>
        <div className="floating-dialog-controls">
          {maximizable && (
            <Button
              variant="ghost"
              size="icon"
              className="floating-dialog-control"
              onClick={handleToggleMaximize}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="floating-dialog-control"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn('floating-dialog-content', contentClassName)}>
        {children}
      </div>

      {/* Resize handle */}
      {resizable && !isMaximized && (
        <div
          className="floating-dialog-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </Card>
  );
};