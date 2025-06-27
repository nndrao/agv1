import React, { useState, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatasourceStatistics } from '@/components/datasource/DatasourceStatistics';

interface DraggableStatisticsDialogProps {
  datasourceId: string;
  datasourceName: string;
  onClose: () => void;
}

export function DraggableStatisticsDialog({ 
  datasourceId, 
  datasourceName, 
  onClose 
}: DraggableStatisticsDialogProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep dialog within viewport bounds
      const maxX = window.innerWidth - (dialogRef.current?.offsetWidth || 500);
      const maxY = window.innerHeight - (dialogRef.current?.offsetHeight || 600);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  return (
    <>
      {/* Transparent overlay - click to close */}
      <div 
        className="fixed inset-0 bg-black/5 z-40"
        onClick={onClose}
      />
      
      {/* Draggable dialog */}
      <div
        ref={dialogRef}
        className="fixed bg-background border rounded-lg shadow-xl z-50 w-[400px] max-h-[70vh] overflow-hidden flex flex-col"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Header with drag handle */}
        <div 
          className="flex items-center justify-between px-3 py-2 border-b cursor-move bg-muted/30"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Statistics</h3>
              <span className="text-xs text-muted-foreground">• {datasourceName}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="overflow-auto p-3">
          <DatasourceStatistics datasourceId={datasourceId} />
        </div>
      </div>
    </>
  );
}