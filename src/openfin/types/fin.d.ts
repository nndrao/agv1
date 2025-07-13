import type { fin as FinApi } from '@openfin/core';

declare global {
  const fin: typeof FinApi;
  
  interface Window {
    dockviewApi?: any;
  }
}