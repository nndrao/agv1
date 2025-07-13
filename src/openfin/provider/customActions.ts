import type { CustomActionsMap, CustomActionPayload } from '@openfin/workspace-platform';
import { CustomActionCallerType, getCurrentSync } from '@openfin/workspace-platform';

export function getCustomActions(): CustomActionsMap {
  const actions = {
    'launch-datatable': async (payload: CustomActionPayload): Promise<void> => {
      console.log('🚀 Launch DataTable action called', payload);
      const platform = getCurrentSync();
      
      // Generate unique ID for the new datatable
      const tableId = `table-${Date.now()}`;
      const datasourceId = payload.customData?.datasourceId || '';
      
      // Create a new browser window with DataTable route
      const window = await platform.Browser.createWindow({
        name: `datatable-${tableId}`,
        url: `http://localhost:5173/datatable/${tableId}${datasourceId ? `?datasource=${datasourceId}` : ''}`,
        defaultWidth: 1200,
        defaultHeight: 800,
        defaultCentered: true,
        saveWindowState: true,
        contextMenu: true,
        accelerator: {
          devtools: true,
          zoom: true,
          reload: true,
          reloadIgnoringCache: true,
        },
      });

      await window.show();
    },

    'manage-profiles': async (payload: CustomActionPayload): Promise<void> => {
      console.log('👤 Manage profiles action called', payload);
      
      // Create simple OpenFin window for profile management
      const window = await fin.Window.create({
        name: 'profile-manager',
        url: 'http://localhost:5173/profiles',
        defaultWidth: 800,
        defaultHeight: 600,
        defaultCentered: true,
        frame: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        autoShow: true,
        saveWindowState: true,
        customData: { 
          type: 'config-dialog',
          purpose: 'profile-management' 
        }
      });
    },

    'import-export-settings': async (payload: CustomActionPayload): Promise<void> => {
      console.log('⚙️ Import/Export settings action called', payload);
      
      // Create simple OpenFin window for settings import/export
      const window = await fin.Window.create({
        name: 'settings-import-export',
        url: 'http://localhost:5173/settings/import-export',
        defaultWidth: 600,
        defaultHeight: 400,
        defaultCentered: true,
        frame: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        autoShow: true,
        saveWindowState: false,
        customData: { 
          type: 'config-dialog',
          purpose: 'settings-import-export' 
        }
      });
    },

    'open-datasources': async (payload: CustomActionPayload): Promise<void> => {
      console.log('💾 Open datasources action called', payload);
      
      // Create simple OpenFin window for datasource configuration
      const window = await fin.Window.create({
        name: 'datasource-config',
        url: 'http://localhost:5173/datasources',
        defaultWidth: 1000,
        defaultHeight: 700,
        defaultCentered: true,
        frame: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        autoShow: true,
        saveWindowState: true,
        customData: { 
          type: 'config-dialog',
          purpose: 'datasource-management' 
        }
      });
    },

    'toggle-edit-mode': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Toggle edit mode action called', payload);
      
      // Send message to the current window to toggle edit mode
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('toggle-edit-mode', {});
      }
    },

    'column-formatting': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Column formatting action called', payload);
      
      // Send message to the current window to open column formatting
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('open-column-formatting', {});
      }
    },

    'open-datasource-config': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Open datasource config action called', payload);
      
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('open-datasource-config', {});
      }
    },

    'save-profile': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Save profile action called', payload);
      
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('save-profile', payload.customData);
      }
    },

    'load-profile': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Load profile action called', payload);
      
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('load-profile', payload.customData);
      }
    },

    'export-data': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Export data action called', payload);
      
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('export-data', payload.customData);
      }
    },

    'toggle-theme': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Toggle theme action called', payload);
      
      // Broadcast theme change to all windows
      const platform = getCurrentSync();
      const windows = await platform.Browser.getAllWindows();
      
      for (const window of windows) {
        await window.dispatch('toggle-theme', {});
      }
    },

    'show-settings': async (payload: CustomActionPayload): Promise<void> => {
      console.log('Show settings action called', payload);
      
      if (payload.windowIdentity) {
        const targetWindow = fin.Window.wrapSync(payload.windowIdentity);
        await targetWindow.dispatch('show-settings', {});
      }
    },

    'debug-platform': async (payload: CustomActionPayload): Promise<void> => {
      if (payload.callerType === CustomActionCallerType.GlobalContextMenu) {
        console.info('Debug Platform Called');
        await fin.System.showDeveloperTools(fin.me.identity);
      }
    },
  };
  
  console.log('📋 Registered custom actions:', Object.keys(actions));
  return actions;
}