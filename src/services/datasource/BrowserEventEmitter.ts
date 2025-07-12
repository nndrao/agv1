// Browser-compatible EventEmitter implementation
export class BrowserEventEmitter {
  private events: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }
    
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
    
    return true;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  // Add compatibility methods for Node.js EventEmitter interface
  addListener(event: string, listener: (...args: any[]) => void): this {
    return this.on(event, listener);
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    return this.off(event, listener);
  }

  setMaxListeners(_n: number): this {
    // No-op for browser compatibility
    return this;
  }

  getMaxListeners(): number {
    // Return Node.js default
    return 10;
  }

  listeners(event: string): Function[] {
    const listeners = this.events.get(event);
    return listeners ? Array.from(listeners) : [];
  }

  rawListeners(event: string): Function[] {
    return this.listeners(event);
  }

  prependListener(event: string, listener: (...args: any[]) => void): this {
    // For simplicity, just add normally (browser doesn't guarantee order)
    return this.on(event, listener);
  }

  prependOnceListener(event: string, listener: (...args: any[]) => void): this {
    // For simplicity, just add normally
    return this.once(event, listener);
  }
}