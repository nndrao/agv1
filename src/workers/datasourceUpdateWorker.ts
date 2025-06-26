// Web Worker for processing datasource updates off the main thread
// This worker calculates row differences and batches updates efficiently

interface UpdateMessage {
  type: 'update' | 'config' | 'reset' | 'sync';
  datasourceId: string;
  data?: any;
  keyColumn?: string;
  currentData?: any[];
  config?: UpdateConfig;
}

interface UpdateConfig {
  batchWindowMs: number;
  maxBatchSize: number;
}

interface Transaction {
  add?: any[];
  update?: any[];
  remove?: any[];
  timestamp: number;
  datasourceId: string;
}

// Store current data state for each datasource
const datasourceData = new Map<string, any[]>();
const datasourceKeyColumns = new Map<string, string>();
const updateConfigs = new Map<string, UpdateConfig>();

// Batch processing
const pendingUpdates = new Map<string, any[]>();
const batchTimers = new Map<string, number>();

// Process incoming messages
self.addEventListener('message', (event: MessageEvent<UpdateMessage>) => {
  const { type, datasourceId, data, keyColumn, currentData, config } = event.data;

  switch (type) {
    case 'config':
      if (config) {
        updateConfigs.set(datasourceId, config);
      }
      if (keyColumn) {
        datasourceKeyColumns.set(datasourceId, keyColumn);
      }
      break;

    case 'reset':
      if (currentData) {
        datasourceData.set(datasourceId, [...currentData]);
        console.log(`[Worker] Reset datasource ${datasourceId} with ${currentData.length} rows`);
      } else {
        console.log(`[Worker] Reset datasource ${datasourceId} with no data`);
      }
      pendingUpdates.delete(datasourceId);
      if (batchTimers.has(datasourceId)) {
        clearTimeout(batchTimers.get(datasourceId)!);
        batchTimers.delete(datasourceId);
      }
      break;

    case 'update':
      processUpdate(datasourceId, data);
      break;
      
    case 'sync':
      if (currentData) {
        // Sync worker state with grid state without triggering updates
        datasourceData.set(datasourceId, [...currentData]);
        console.log(`[Worker] Synced datasource ${datasourceId} with ${currentData.length} rows from grid`);
      }
      break;
  }
});

function processUpdate(datasourceId: string, updates: any) {
  // Check if we have initial data for this datasource
  if (!datasourceData.has(datasourceId)) {
    console.warn(`[Worker] Ignoring update for ${datasourceId} - no initial data yet`);
    return;
  }
  
  // Get or initialize pending updates
  let pending = pendingUpdates.get(datasourceId) || [];
  
  // Add new updates to pending
  if (Array.isArray(updates)) {
    pending.push(...updates);
  } else {
    pending.push(updates);
  }
  
  pendingUpdates.set(datasourceId, pending);

  // Get config
  const config = updateConfigs.get(datasourceId) || { 
    batchWindowMs: 60, 
    maxBatchSize: 1000 
  };

  // Clear existing timer
  if (batchTimers.has(datasourceId)) {
    clearTimeout(batchTimers.get(datasourceId)!);
  }

  // Process immediately if batch is full
  if (pending.length >= config.maxBatchSize) {
    processBatch(datasourceId);
  } else {
    // Otherwise, set timer for batch window
    const timer = self.setTimeout(() => {
      processBatch(datasourceId);
    }, config.batchWindowMs);
    batchTimers.set(datasourceId, timer);
  }
}

function processBatch(datasourceId: string) {
  const pending = pendingUpdates.get(datasourceId);
  if (!pending || pending.length === 0) return;

  const keyColumn = datasourceKeyColumns.get(datasourceId);
  const currentData = datasourceData.get(datasourceId) || [];
  
  // Calculate transaction
  const transaction = calculateTransaction(currentData, pending, keyColumn);
  
  // Update our local state
  applyTransactionToData(datasourceId, transaction, keyColumn);
  
  // Clear pending updates
  pendingUpdates.delete(datasourceId);
  batchTimers.delete(datasourceId);
  
  // Send transaction back to main thread
  self.postMessage({
    type: 'transaction',
    datasourceId,
    transaction,
    updateCount: pending.length
  });
}

function calculateTransaction(
  currentData: any[], 
  updates: any[], 
  keyColumn?: string
): Transaction {
  const transaction: Transaction = {
    timestamp: Date.now(),
    datasourceId: ''
  };

  if (!keyColumn) {
    // Without key column, treat all as additions
    console.log('[Worker] No key column, treating all as additions:', updates.length);
    transaction.add = updates;
    return transaction;
  }
  
  // If we have no current data, these must all be additions
  if (currentData.length === 0) {
    console.log('[Worker] No current data, treating all as additions:', updates.length);
    transaction.add = updates;
    return transaction;
  }

  // Create lookup map for current data
  const currentMap = new Map<any, any>();
  currentData.forEach(row => {
    if (row[keyColumn] !== undefined) {
      currentMap.set(row[keyColumn], row);
    }
  });

  const adds: any[] = [];
  const updates_: any[] = [];

  // Log for debugging
  const sampleKeys = updates.slice(0, 5).map(u => u[keyColumn]);
  const existingKeys = sampleKeys.filter(key => currentMap.has(key));
  
  console.log('[Worker] Processing updates:', {
    currentDataSize: currentData.length,
    updateCount: updates.length,
    keyColumn,
    currentMapSize: currentMap.size,
    sampleKeys,
    existingKeysCount: existingKeys.length,
    existingKeys
  });

  // Process each update
  updates.forEach(update => {
    const key = update[keyColumn];
    if (key === undefined) {
      console.warn('[Worker] Update missing key column:', keyColumn, update);
      return;
    }

    if (currentMap.has(key)) {
      // Existing row - check if actually changed
      const existing = currentMap.get(key);
      if (hasChanged(existing, update)) {
        updates_.push(update);
      }
    } else {
      // New row - treat as addition
      // This handles the case where updates arrive during snapshot loading
      console.log(`[Worker] Row ${key} not found in current data, treating as addition`);
      adds.push(update);
    }
  });

  console.log('[Worker] Transaction calculated:', {
    adds: adds.length,
    updates: updates_.length
  });

  if (adds.length > 0) transaction.add = adds;
  if (updates_.length > 0) transaction.update = updates_;

  return transaction;
}

function hasChanged(existing: any, update: any): boolean {
  // Simple shallow comparison - could be enhanced
  for (const key in update) {
    if (existing[key] !== update[key]) {
      return true;
    }
  }
  return false;
}

function applyTransactionToData(
  datasourceId: string, 
  transaction: Transaction, 
  keyColumn?: string
) {
  const data = datasourceData.get(datasourceId) || [];
  let newData = [...data];

  if (keyColumn) {
    // Apply updates
    if (transaction.update) {
      transaction.update.forEach(update => {
        const index = newData.findIndex(row => row[keyColumn] === update[keyColumn]);
        if (index >= 0) {
          newData[index] = { ...newData[index], ...update };
        }
      });
    }

    // Apply additions
    if (transaction.add) {
      newData.push(...transaction.add);
    }

    // Apply removals
    if (transaction.remove) {
      const keysToRemove = new Set(transaction.remove.map(r => r[keyColumn]));
      newData = newData.filter(row => !keysToRemove.has(row[keyColumn]));
    }
  } else {
    // Without key column, just append additions
    if (transaction.add) {
      newData.push(...transaction.add);
    }
  }

  datasourceData.set(datasourceId, newData);
}

// Export for TypeScript
export {};