import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { SettingsExportService, ExportedSettings } from '@/services/settings/SettingsExportService';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'import' | 'export';
  importFile?: File;
  onImportComplete?: () => void;
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onOpenChange,
  mode,
  importFile,
  onImportComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOptions, setImportOptions] = useState({
    profiles: true,
    datasources: true,
    columnTemplates: true,
    workspaces: true,
    uiPreferences: true,
    customSettings: true,
    overwrite: false
  });
  const [importPreview, setImportPreview] = useState<ExportedSettings | null>(null);

  React.useEffect(() => {
    if (mode === 'import' && importFile) {
      loadImportPreview();
    }
  }, [mode, importFile]);

  const loadImportPreview = async () => {
    if (!importFile) return;
    
    try {
      setLoading(true);
      setError(null);
      const settings = await SettingsExportService.readSettingsFile(importFile);
      setImportPreview(settings);
    } catch (err) {
      setError('Failed to read import file. Please ensure it is a valid settings export.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await SettingsExportService.exportAllSettings();
      SettingsExportService.downloadSettings(settings);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to export settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importPreview) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await SettingsExportService.importSettings(importPreview, importOptions);
      
      if (result.success) {
        onImportComplete?.();
        onOpenChange(false);
      } else {
        setError(`Import completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      setError('Failed to import settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (key: keyof NonNullable<ExportedSettings['data']>) => {
    if (!importPreview?.data || !importPreview.data[key]) return 0;
    return Array.isArray(importPreview.data[key]) 
      ? importPreview.data[key]!.length 
      : Object.keys(importPreview.data[key]!).length;
  };
  
  const isNewFormat = importPreview && parseFloat(importPreview.version) >= 2.0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'export' ? 'Export Settings' : 'Import Settings'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export' 
              ? 'Export all application settings to a file for backup or sharing.'
              : 'Select which settings to import from the file.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === 'import' && importPreview && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Export Version: {importPreview.version}</p>
              <p>Exported: {new Date(importPreview.exportDate).toLocaleString()}</p>
              {importPreview.metadata && (
                <>
                  <p>Total Keys: {importPreview.metadata.totalKeys}</p>
                  <p>Total Size: {importPreview.metadata.totalSize}</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              {/* New format - show localStorage info */}
              {isNewFormat && importPreview.localStorage && (
                <div className="space-y-2">
                  <h4 className="font-medium">localStorage Contents:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs">
                    {Object.keys(importPreview.localStorage).map(key => (
                      <div key={key} className="py-1">
                        <span className="font-mono">{key}</span>
                        <span className="text-muted-foreground ml-2">
                          ({importPreview.localStorage![key].length} chars)
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="overwrite"
                      checked={importOptions.overwrite}
                      onCheckedChange={(checked) => 
                        setImportOptions(prev => ({ ...prev, overwrite: !!checked }))
                      }
                    />
                    <Label htmlFor="overwrite" className="flex-1 cursor-pointer">
                      Clear existing settings before import
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will replace your entire localStorage. A backup will be created automatically.
                  </p>
                </div>
              )}
              
              {/* Legacy format - show individual categories */}
              {!isNewFormat && importPreview.data && (
                <>
              {importPreview.data.profiles && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="profiles"
                    checked={importOptions.profiles}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, profiles: !!checked }))
                    }
                  />
                  <Label htmlFor="profiles" className="flex-1 cursor-pointer">
                    Grid Profiles ({getItemCount('profiles')} items)
                  </Label>
                </div>
              )}

              {importPreview.data.datasources && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="datasources"
                    checked={importOptions.datasources}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, datasources: !!checked }))
                    }
                  />
                  <Label htmlFor="datasources" className="flex-1 cursor-pointer">
                    Data Sources ({getItemCount('datasources')} items)
                  </Label>
                </div>
              )}

              {importPreview.data.columnTemplates && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="columnTemplates"
                    checked={importOptions.columnTemplates}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, columnTemplates: !!checked }))
                    }
                  />
                  <Label htmlFor="columnTemplates" className="flex-1 cursor-pointer">
                    Column Templates ({getItemCount('columnTemplates')} items)
                  </Label>
                </div>
              )}

              {importPreview.data.workspaces && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workspaces"
                    checked={importOptions.workspaces}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, workspaces: !!checked }))
                    }
                  />
                  <Label htmlFor="workspaces" className="flex-1 cursor-pointer">
                    Workspaces ({getItemCount('workspaces')} items)
                  </Label>
                </div>
              )}

              {importPreview.data.uiPreferences && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uiPreferences"
                    checked={importOptions.uiPreferences}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, uiPreferences: !!checked }))
                    }
                  />
                  <Label htmlFor="uiPreferences" className="flex-1 cursor-pointer">
                    UI Preferences ({getItemCount('uiPreferences')} items)
                  </Label>
                </div>
              )}

              {importPreview.data.customSettings && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customSettings"
                    checked={importOptions.customSettings}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, customSettings: !!checked }))
                    }
                  />
                  <Label htmlFor="customSettings" className="flex-1 cursor-pointer">
                    Other Settings ({getItemCount('customSettings')} items)
                  </Label>
                </div>
              )}

                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overwrite-legacy"
                      checked={importOptions.overwrite}
                      onCheckedChange={(checked) => 
                        setImportOptions(prev => ({ ...prev, overwrite: !!checked }))
                      }
                    />
                    <Label htmlFor="overwrite-legacy" className="flex-1 cursor-pointer">
                      Overwrite existing settings
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    If unchecked, only new items will be imported
                  </p>
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {mode === 'export' && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will export your entire localStorage (all settings, profiles, data sources, etc.) 
              into a single file that can be imported later. Sensitive keys like tokens and passwords 
              will be automatically excluded.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={mode === 'export' ? handleExport : handleImport}
            disabled={loading || (mode === 'import' && !importPreview)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'export' ? 'Export' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};