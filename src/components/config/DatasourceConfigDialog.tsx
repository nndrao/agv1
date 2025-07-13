import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, RefreshCw, Plus, Trash2, Cable, Database } from 'lucide-react';
import { providerWindowManager } from '@/openfin/services/ProviderWindowManager';
import type { IDataSourceConfig } from '@/providers/IDataSourceProvider';

/**
 * Datasource configuration dialog for OpenFin simple window
 */
export const DatasourceConfigDialog: React.FC = () => {
  const [datasources, setDatasources] = useState<IDataSourceConfig[]>([]);
  const [selectedDatasource, setSelectedDatasource] = useState<IDataSourceConfig | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<Map<string, string>>(new Map());
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load datasources from storage (for now using demo data)
  useEffect(() => {
    loadDatasources();
    
    // Subscribe to provider status changes
    const unsubscribe = providerWindowManager.onStatusChange((providerId, status) => {
      setProviderStatuses(prev => new Map(prev).set(providerId, status));
    });

    return unsubscribe;
  }, []);

  const loadDatasources = async () => {
    // TODO: Load from MongoDB/storage
    // For now, use demo datasources
    const demoDatasources: IDataSourceConfig[] = [
      {
        id: 'market-data-fx',
        name: 'FX Market Data',
        type: 'stomp',
        url: 'ws://localhost:8080/stomp',
        topics: ['/topic/fx-rates'],
        keyColumn: 'symbol',
        componentId: 'fx-provider-1'
      },
      {
        id: 'market-data-equity',
        name: 'Equity Market Data',
        type: 'stomp',
        url: 'ws://localhost:8080/stomp',
        topics: ['/topic/equity-prices'],
        keyColumn: 'ticker',
        componentId: 'equity-provider-1'
      }
    ];
    
    setDatasources(demoDatasources);
    
    // Get current provider statuses
    const providers = providerWindowManager.getProviders();
    const statusMap = new Map<string, string>();
    providers.forEach(p => statusMap.set(p.config.componentId || p.id, p.status));
    setProviderStatuses(statusMap);
  };

  const saveDatasource = async (config: IDataSourceConfig) => {
    // TODO: Save to MongoDB
    console.log('Saving datasource:', config);
    
    // Update local state
    setDatasources(prev => {
      const existing = prev.find(ds => ds.id === config.id);
      if (existing) {
        return prev.map(ds => ds.id === config.id ? config : ds);
      }
      return [...prev, config];
    });
    
    setIsCreatingNew(false);
    setSelectedDatasource(config);
  };

  const startProvider = async (datasource: IDataSourceConfig) => {
    try {
      await providerWindowManager.createProvider(datasource);
    } catch (error) {
      console.error('Failed to start provider:', error);
    }
  };

  const stopProvider = async (datasource: IDataSourceConfig) => {
    const providerId = datasource.componentId || datasource.id;
    await providerWindowManager.stopProvider(providerId);
  };

  const restartProvider = async (datasource: IDataSourceConfig) => {
    const providerId = datasource.componentId || datasource.id;
    await providerWindowManager.restartProvider(providerId);
  };

  const getProviderStatus = (datasource: IDataSourceConfig): string => {
    const providerId = datasource.componentId || datasource.id;
    return providerStatuses.get(providerId) || 'stopped';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Data Sources Configuration
        </h1>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Datasource List */}
          <Card className="col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Data Sources</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedDatasource({
                      id: `datasource-${Date.now()}`,
                      name: 'New Data Source',
                      type: 'stomp',
                      url: 'ws://localhost:8080/stomp',
                      topics: [],
                      keyColumn: 'id',
                      componentId: `provider-${Date.now()}`
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-2">
                {datasources.map(ds => {
                  const status = getProviderStatus(ds);
                  return (
                    <div
                      key={ds.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDatasource?.id === ds.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedDatasource(ds);
                        setIsCreatingNew(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cable className="h-4 w-4" />
                          <span className="font-medium">{ds.name}</span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          status === 'running' ? 'bg-green-500/20 text-green-500' :
                          status === 'error' ? 'bg-red-500/20 text-red-500' :
                          status === 'starting' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {status}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ds.type === 'stomp' ? 'WebSocket' : ds.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Form */}
          {selectedDatasource && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Configure the data source connection and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="connection">
                  <TabsList>
                    <TabsTrigger value="connection">Connection</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="connection" className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={selectedDatasource.name}
                        onChange={(e) => setSelectedDatasource({
                          ...selectedDatasource,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">WebSocket URL</Label>
                      <Input
                        id="url"
                        value={selectedDatasource.url}
                        onChange={(e) => setSelectedDatasource({
                          ...selectedDatasource,
                          url: e.target.value
                        })}
                        placeholder="ws://localhost:8080/stomp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyColumn">Key Column</Label>
                      <Input
                        id="keyColumn"
                        value={selectedDatasource.keyColumn}
                        onChange={(e) => setSelectedDatasource({
                          ...selectedDatasource,
                          keyColumn: e.target.value
                        })}
                        placeholder="id"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="topics" className="space-y-4">
                    <div>
                      <Label>Subscribed Topics</Label>
                      <div className="space-y-2 mt-2">
                        {selectedDatasource.topics?.map((topic, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={topic}
                              onChange={(e) => {
                                const newTopics = [...(selectedDatasource.topics || [])];
                                newTopics[index] = e.target.value;
                                setSelectedDatasource({
                                  ...selectedDatasource,
                                  topics: newTopics
                                });
                              }}
                              placeholder="/topic/example"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const newTopics = selectedDatasource.topics?.filter((_, i) => i !== index);
                                setSelectedDatasource({
                                  ...selectedDatasource,
                                  topics: newTopics
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDatasource({
                            ...selectedDatasource,
                            topics: [...(selectedDatasource.topics || []), '']
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Topic
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div>
                      <Label htmlFor="componentId">Component ID</Label>
                      <Input
                        id="componentId"
                        value={selectedDatasource.componentId}
                        onChange={(e) => setSelectedDatasource({
                          ...selectedDatasource,
                          componentId: e.target.value
                        })}
                        disabled={!isCreatingNew}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reconnectInterval">Reconnect Interval (ms)</Label>
                      <Input
                        id="reconnectInterval"
                        type="number"
                        value={selectedDatasource.reconnectInterval || 5000}
                        onChange={(e) => setSelectedDatasource({
                          ...selectedDatasource,
                          reconnectInterval: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between mt-6">
                  <div className="flex gap-2">
                    {getProviderStatus(selectedDatasource) === 'stopped' ? (
                      <Button
                        variant="default"
                        onClick={() => startProvider(selectedDatasource)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => stopProvider(selectedDatasource)}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => restartProvider(selectedDatasource)}
                      disabled={getProviderStatus(selectedDatasource) === 'stopped'}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Restart
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => saveDatasource(selectedDatasource)}
                  >
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};