import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Globe } from 'lucide-react';
import type { RestConfig } from '../types';

interface RestConfigurationProps {
  config: RestConfig;
  onChange: (config: RestConfig) => void;
}

export function RestConfiguration({ config, onChange }: RestConfigurationProps) {
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleChange = (field: keyof RestConfig, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      onChange({
        ...config,
        headers: {
          ...config.headers,
          [headerKey]: headerValue
        }
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...config.headers };
    delete newHeaders[key];
    onChange({
      ...config,
      headers: newHeaders
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-blue-600" />
            REST Endpoint Configuration
          </CardTitle>
          <CardDescription>
            Configure HTTP endpoint for data fetching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <Label htmlFor="method">Method</Label>
              <Select value={config.method} onValueChange={(v) => handleChange('method', v)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-3">
              <Label htmlFor="url">
                Endpoint URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                placeholder="https://api.example.com/data"
                value={config.url}
                onChange={(e) => handleChange('url', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Headers</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange({
                      ...config,
                      headers: {
                        ...config.headers,
                        'Content-Type': 'application/json'
                      }
                    });
                  }}
                >
                  Add JSON Header
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange({
                      ...config,
                      headers: {
                        ...config.headers,
                        'Authorization': 'Bearer YOUR_TOKEN'
                      }
                    });
                  }}
                >
                  Add Auth Header
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(config.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Input value={key} readOnly className="flex-1" />
                  <Input value={value} readOnly className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeHeader(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Header name"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHeader()}
                />
                <Input
                  placeholder="Header value"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHeader()}
                />
                <Button size="sm" onClick={addHeader}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {(config.method === 'POST' || config.method === 'PUT') && (
            <div className="space-y-2">
              <Label htmlFor="body">Request Body</Label>
              <Textarea
                id="body"
                placeholder='{"filter": "active", "limit": 100}'
                value={config.body}
                onChange={(e) => handleChange('body', e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                JSON body for POST/PUT requests
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}