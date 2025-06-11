import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Zap } from 'lucide-react';
import type { StompConfig } from '../types';

interface StompConfigurationProps {
  config: StompConfig;
  onChange: (config: StompConfig) => void;
}

export function StompConfiguration({ config, onChange }: StompConfigurationProps) {
  const handleChange = (field: keyof StompConfig, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-600" />
            STOMP Server Configuration
          </CardTitle>
          <CardDescription>
            Configure WebSocket connection for real-time data streaming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websocket-url">
              WebSocket Connection String <span className="text-destructive">*</span>
            </Label>
            <Input
              id="websocket-url"
              placeholder="ws://localhost:8080/ws"
              value={config.websocketUrl}
              onChange={(e) => handleChange('websocketUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Full WebSocket URL including protocol (ws:// or wss://)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">
              Subscription Topic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="/topic/market-data"
              value={config.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              STOMP topic to subscribe for receiving messages
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-message">
              Trigger Message
            </Label>
            <Textarea
              id="trigger-message"
              placeholder='{"action": "subscribe", "symbols": ["AAPL", "GOOGL"]}'
              value={config.triggerMessage}
              onChange={(e) => handleChange('triggerMessage', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional message to send to the server to initiate data publishing
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="snapshot-token">
              Snapshot End Token
            </Label>
            <Input
              id="snapshot-token"
              placeholder="SNAPSHOT_END"
              value={config.snapshotToken}
              onChange={(e) => handleChange('snapshotToken', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Token that signals the end of initial data snapshot (default: SNAPSHOT_END)
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Connection Flow:</strong>
          <ol className="mt-2 ml-4 text-sm space-y-1 list-decimal">
            <li>Establish WebSocket connection to the server</li>
            <li>Send STOMP CONNECT frame for authentication</li>
            <li>Subscribe to the specified topic</li>
            <li>Optionally send trigger message to initiate data flow</li>
            <li>Receive real-time updates until snapshot token is received</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}