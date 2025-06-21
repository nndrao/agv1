# Real-Time Updates Implementation

## Overview
This implementation provides an event-based system for handling real-time updates in the DataTable using:
- Web Workers for off-thread processing
- Event emitters for ordered async delivery
- AG-Grid's `applyTransactionAsync` for efficient batch updates

## Architecture

### 1. Web Worker (`datasourceUpdateWorker.ts`)
- Processes updates off the main thread
- Calculates row differences (add/update/remove)
- Batches updates (50ms windows by default)
- Maintains local data state for efficient diffing

### 2. Update Event System (`UpdateEventEmitter.ts`)
- Custom event emitter with FIFO queue
- Ensures ordered processing of updates
- Provides backpressure handling
- Tracks processing metrics

### 3. Enhanced DatasourceContext
- Initializes Web Worker for update processing
- Routes real-time updates through worker
- Provides event subscription for components
- Stores only initial snapshot data in state

### 4. useDataSourceUpdates Hook
- Subscribes to datasource update events
- Configures AG-Grid for async transactions
- Applies transactions using `applyTransactionAsync`
- Provides metrics and manual flush capability

## Data Flow

1. **Initial Load**:
   - DataTable receives initial snapshot data through props
   - Grid displays data immediately

2. **Real-Time Updates**:
   - STOMP provider receives updates
   - Updates sent to Web Worker via `postMessage`
   - Worker calculates transaction (add/update/remove)
   - Worker posts transaction back to main thread
   - UpdateEventEmitter queues transaction
   - Component receives event via `useDataSourceUpdates`
   - AG-Grid applies transaction asynchronously

## Configuration

```typescript
// In DataTableContainer
const { flushTransactions, getMetrics } = useDataSourceUpdates({
  datasourceId: selectedDatasourceId,
  gridApi: gridApiRef.current,
  keyColumn: datasource.keyColumn,
  asyncTransactionWaitMillis: 50, // Batch window
  onUpdateError: (error) => console.error(error)
});
```

## Performance Benefits

- **Non-blocking UI**: Updates processed in Web Worker
- **Efficient batching**: Multiple updates combined in 50ms windows
- **Minimal DOM updates**: Only changed rows are updated
- **Preserved state**: Filters, sorts, selections maintained
- **High throughput**: AG-Grid can handle 150,000+ updates/second

## Key Features

1. **Ordered Processing**: FIFO queue ensures updates apply in order
2. **Error Handling**: Failed updates don't block the queue
3. **Metrics**: Track update counts and processing times
4. **Manual Control**: Can flush transactions on demand
5. **Graceful Degradation**: Falls back if Worker fails

## Usage

The system works automatically once a datasource is selected. Components using the DataTable will receive real-time updates without any additional configuration needed.

To monitor performance:
```typescript
const metrics = getMetrics();
console.log('Update metrics:', metrics);
```

To manually flush pending transactions:
```typescript
flushTransactions();
```