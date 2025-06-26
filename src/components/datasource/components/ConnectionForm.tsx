import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionFormProps {
  name: string;
  websocketUrl: string;
  listenerTopic: string;
  requestMessage: string;
  snapshotEndToken: string;
  keyColumn: string;
  messageRate: string;
  autoStart: boolean;
  testing: boolean;
  testResult: any;
  testError: string;
  onNameChange: (value: string) => void;
  onWebsocketUrlChange: (value: string) => void;
  onListenerTopicChange: (value: string) => void;
  onRequestMessageChange: (value: string) => void;
  onSnapshotEndTokenChange: (value: string) => void;
  onKeyColumnChange: (value: string) => void;
  onMessageRateChange: (value: string) => void;
  onAutoStartChange: (value: boolean) => void;
  onTestConnection: () => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  name,
  websocketUrl,
  listenerTopic,
  requestMessage,
  snapshotEndToken,
  keyColumn,
  messageRate,
  autoStart,
  testing,
  testResult,
  testError,
  onNameChange,
  onWebsocketUrlChange,
  onListenerTopicChange,
  onRequestMessageChange,
  onSnapshotEndTokenChange,
  onKeyColumnChange,
  onMessageRateChange,
  onAutoStartChange,
  onTestConnection,
}) => {
  return (
    <div className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter datasource name"
        />
      </div>

      {/* WebSocket URL */}
      <div className="space-y-2">
        <Label htmlFor="websocket-url">WebSocket URL</Label>
        <Input
          id="websocket-url"
          value={websocketUrl}
          onChange={(e) => onWebsocketUrlChange(e.target.value)}
          placeholder="ws://localhost:8080/stomp"
          type="url"
        />
      </div>

      {/* Listener Topic */}
      <div className="space-y-2">
        <Label htmlFor="listener-topic">Listener Topic</Label>
        <Input
          id="listener-topic"
          value={listenerTopic}
          onChange={(e) => onListenerTopicChange(e.target.value)}
          placeholder="/topic/data"
        />
      </div>

      {/* Request Message */}
      <div className="space-y-2">
        <Label htmlFor="request-message">Request Message</Label>
        <Textarea
          id="request-message"
          value={requestMessage}
          onChange={(e) => onRequestMessageChange(e.target.value)}
          placeholder="START"
          rows={3}
        />
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium">Advanced Settings</h4>
        
        {/* Snapshot End Token */}
        <div className="space-y-2">
          <Label htmlFor="snapshot-token">Snapshot End Token</Label>
          <Input
            id="snapshot-token"
            value={snapshotEndToken}
            onChange={(e) => onSnapshotEndTokenChange(e.target.value)}
            placeholder="Success"
          />
        </div>

        {/* Key Column */}
        <div className="space-y-2">
          <Label htmlFor="key-column">Key Column</Label>
          <Input
            id="key-column"
            value={keyColumn}
            onChange={(e) => onKeyColumnChange(e.target.value)}
            placeholder="id"
          />
        </div>

        {/* Message Rate */}
        <div className="space-y-2">
          <Label htmlFor="message-rate">Message Rate (ms)</Label>
          <Input
            id="message-rate"
            value={messageRate}
            onChange={(e) => onMessageRateChange(e.target.value)}
            placeholder="1000"
            type="number"
            min="100"
          />
        </div>

        {/* Auto Start */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto-start"
            checked={autoStart}
            onCheckedChange={onAutoStartChange}
          />
          <Label htmlFor="auto-start" className="cursor-pointer">
            Auto-start connection
          </Label>
        </div>
      </div>

      {/* Test Connection Button */}
      <div className="pt-4">
        <Button
          onClick={onTestConnection}
          disabled={testing || !websocketUrl}
          className="w-full"
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
      </div>

      {/* Test Results */}
      {testError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{testError}</AlertDescription>
        </Alert>
      )}
      
      {testResult?.success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Connection successful!</AlertDescription>
        </Alert>
      )}
    </div>
  );
};