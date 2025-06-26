import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragOptions {
  initialPosition?: Position;
  bounds?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
}

export function useDraggable(options: DragOptions = {}) {
  const [position, setPosition] = useState<Position>(
    options.initialPosition || { x: 0, y: 0 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    options.onDragStart?.(position);
  }, [position, options]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Apply bounds if specified
      if (options.bounds) {
        if (options.bounds.left !== undefined) {
          newX = Math.max(options.bounds.left, newX);
        }
        if (options.bounds.top !== undefined) {
          newY = Math.max(options.bounds.top, newY);
        }
        if (options.bounds.right !== undefined) {
          newX = Math.min(options.bounds.right, newX);
        }
        if (options.bounds.bottom !== undefined) {
          newY = Math.min(options.bounds.bottom, newY);
        }
      }

      const newPosition = { x: newX, y: newY };
      setPosition(newPosition);
      options.onDrag?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      options.onDragEnd?.(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset, position, options]);

  return {
    position,
    isDragging,
    handleMouseDown,
    setPosition,
  };
}