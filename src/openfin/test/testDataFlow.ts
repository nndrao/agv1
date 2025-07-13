/**
 * Test script for multi-window data flow via OpenFin channels
 * Run this in the browser console of the provider window
 */

import { channelManager } from '../channels/ChannelManager';
import { providerWindowManager } from '../services/ProviderWindowManager';

export async function testDataFlow() {
  console.log('🧪 Starting multi-window data flow test...');
  
  try {
    // Step 1: Create a test provider
    console.log('1️⃣ Creating test data provider...');
    const testConfig = {
      id: 'test-provider-1',
      name: 'Test Provider',
      type: 'stomp' as const,
      url: 'ws://localhost:8080/stomp',
      topics: ['/topic/test-data'],
      keyColumn: 'id',
      componentId: 'test-provider-1'
    };
    
    const providerId = await providerWindowManager.createProvider(testConfig);
    console.log(`✅ Provider created: ${providerId}`);
    
    // Step 2: Create a test channel
    console.log('2️⃣ Creating test channel...');
    const channelName = `test-channel-${Date.now()}`;
    await channelManager.createChannel({
      name: channelName,
      type: 'data',
      description: 'Test channel for data flow'
    });
    console.log(`✅ Channel created: ${channelName}`);
    
    // Step 3: Subscribe to channel updates
    console.log('3️⃣ Subscribing to channel updates...');
    const unsubscribe = await channelManager.subscribeToUpdates(
      channelName,
      'data-update',
      (data) => {
        console.log('📨 Received data update:', data);
      }
    );
    
    // Step 4: Send test data
    console.log('4️⃣ Sending test data...');
    const testData = {
      rows: [
        { id: 1, name: 'Test Item 1', value: 100 },
        { id: 2, name: 'Test Item 2', value: 200 },
        { id: 3, name: 'Test Item 3', value: 300 }
      ],
      count: 3,
      isLast: true,
      timestamp: new Date().toISOString()
    };
    
    await channelManager.broadcast(channelName, 'data-update', testData);
    console.log('✅ Test data sent');
    
    // Step 5: Create a DataTable window to consume the data
    console.log('5️⃣ Creating DataTable window...');
    const platform = fin.Platform.getCurrentSync();
    const tableWindow = await platform.Browser.createWindow({
      name: 'test-datatable',
      url: `http://localhost:5173/datatable/test-table?channel=${channelName}`,
      defaultWidth: 1000,
      defaultHeight: 600,
      defaultCentered: true,
      autoShow: true
    });
    
    console.log('✅ DataTable window created');
    
    // Step 6: Wait and send more data
    setTimeout(async () => {
      console.log('6️⃣ Sending additional test data...');
      const moreData = {
        rows: [
          { id: 4, name: 'Test Item 4', value: 400 },
          { id: 5, name: 'Test Item 5', value: 500 }
        ],
        count: 2,
        isLast: false,
        timestamp: new Date().toISOString()
      };
      
      await channelManager.broadcast(channelName, 'data-update', moreData);
      console.log('✅ Additional data sent');
    }, 3000);
    
    // Cleanup after 10 seconds
    setTimeout(async () => {
      console.log('7️⃣ Cleaning up test...');
      unsubscribe();
      await channelManager.closeChannel(channelName);
      await providerWindowManager.stopProvider(providerId);
      console.log('✅ Test cleanup complete');
    }, 10000);
    
    console.log('🎉 Test started successfully! Check the DataTable window for data updates.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test function to debug dock buttons
export async function testDockButtons() {
  console.log('🧪 Testing dock button registration...');
  
  try {
    const { Dock } = await import('@openfin/workspace');
    const { registerDockProvider } = await import('../dock/dockProvider');
    
    // Hide the current dock
    console.log('🔄 Hiding current dock...');
    await Dock.hide();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Re-register our dock
    console.log('📝 Re-registering dock with custom buttons...');
    await registerDockProvider(
      'agv1-workspace-platform-test',
      'AGV1 Test Dock',
      'http://localhost:5173/vite.svg'
    );
    
    console.log('✅ Dock re-registered! Check if buttons appear now.');
    
  } catch (error) {
    console.error('❌ Dock button test failed:', error);
  }
}

// Function to force refresh dock
export async function refreshDock() {
  console.log('🔄 Refreshing dock...');
  
  try {
    const { Dock } = await import('@openfin/workspace');
    
    // Hide and show dock
    await Dock.hide();
    await new Promise(resolve => setTimeout(resolve, 200));
    await Dock.show();
    console.log('✅ Dock refreshed');
  } catch (error) {
    console.error('❌ Failed to refresh dock:', error);
  }
}

// Function to check current dock configuration
export async function checkDock() {
  console.log('🔍 Checking dock configuration...');
  
  try {
    const { Dock } = await import('@openfin/workspace');
    console.log('📊 Dock module loaded:', Dock);
    
    // Try to hide and show to see if it's working
    console.log('Testing hide/show...');
    await Dock.hide();
    console.log('Hidden');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await Dock.show();
    console.log('Shown');
    
  } catch (error) {
    console.error('❌ Dock check failed:', error);
  }
}

// Export for use in console
(window as any).testDataFlow = testDataFlow;
(window as any).testDockButtons = testDockButtons;
(window as any).refreshDock = refreshDock;
(window as any).checkDock = checkDock;