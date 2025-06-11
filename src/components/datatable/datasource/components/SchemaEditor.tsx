import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileJson,
  Sparkles,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Code
} from 'lucide-react';

interface SchemaEditorProps {
  schema: any | null;
  onChange: (schema: any) => void;
  testData?: any[];
}

export function SchemaEditor({ schema, onChange, testData }: SchemaEditorProps) {
  const [schemaText, setSchemaText] = useState('');
  const [error, setError] = useState('');
  const [inferring, setInferring] = useState(false);

  useEffect(() => {
    if (schema) {
      setSchemaText(JSON.stringify(schema, null, 2));
    }
  }, [schema]);

  const validateAndSetSchema = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setError('');
      onChange(parsed);
      return true;
    } catch (e) {
      setError('Invalid JSON: ' + (e as Error).message);
      return false;
    }
  };

  const inferSchemaFromData = () => {
    if (!testData || testData.length === 0) {
      setError('No test data available. Please test the connection first.');
      return;
    }

    setInferring(true);
    
    // Simulate async operation
    setTimeout(() => {
      const inferredSchema = inferSchema(testData);
      onChange(inferredSchema);
      setSchemaText(JSON.stringify(inferredSchema, null, 2));
      setInferring(false);
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSchemaText(text);
      validateAndSetSchema(text);
    };
    reader.readAsText(file);
  };

  const downloadSchema = () => {
    if (!schema) return;
    
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Schema Configuration
          </div>
          <div className="flex items-center gap-2">
            {schema && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid Schema
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Define or infer the data structure for column generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Manual Entry</TabsTrigger>
            <TabsTrigger value="infer">Auto Infer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-4">
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="schema-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('schema-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSchema}
                disabled={!schema}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <Textarea
              placeholder="Paste your JSON schema here..."
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              onBlur={() => schemaText && validateAndSetSchema(schemaText)}
              rows={15}
              className="font-mono text-sm"
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="infer" className="space-y-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatic Schema Inference</strong>
                <p className="mt-2">
                  The system will analyze your test data to automatically generate a schema.
                  This works best with a large sample of data to ensure all fields are detected.
                </p>
              </AlertDescription>
            </Alert>
            
            {testData && testData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Test data available</p>
                    <p className="text-sm text-muted-foreground">
                      {testData.length} records ready for analysis
                    </p>
                  </div>
                  <Button onClick={inferSchemaFromData} disabled={inferring}>
                    {inferring ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Infer Schema
                      </>
                    )}
                  </Button>
                </div>
                
                {schema && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Inferred Schema</h4>
                      <Badge variant="outline">
                        {Object.keys(schema.properties || {}).length} fields detected
                      </Badge>
                    </div>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                      {JSON.stringify(schema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test data available</p>
                <p className="text-sm mt-2">
                  Test your connection first to enable automatic schema inference
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Schema inference function
function inferSchema(data: any[]): any {
  if (!data || data.length === 0) return null;

  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);

  const schema: any = {
    type: 'object',
    properties: {},
    required: []
  };

  const fieldInfo: Record<string, { types: Set<string>, nullable: boolean, required: boolean }> = {};

  // Analyze all records
  sample.forEach(record => {
    Object.keys(record).forEach(key => {
      if (!fieldInfo[key]) {
        fieldInfo[key] = { types: new Set(), nullable: false, required: true };
      }
      
      const value = record[key];
      
      if (value === null || value === undefined) {
        fieldInfo[key].nullable = true;
      } else {
        const type = getJsonType(value);
        fieldInfo[key].types.add(type);
      }
    });
    
    // Check which fields are missing
    Object.keys(fieldInfo).forEach(key => {
      if (!(key in record)) {
        fieldInfo[key].required = false;
      }
    });
  });

  // Build schema from analysis
  Object.entries(fieldInfo).forEach(([field, info]) => {
    const types = Array.from(info.types);
    let primaryType = types[0] || 'string';
    
    // Special handling for mixed types
    if (types.includes('number') && types.includes('string')) {
      primaryType = 'string'; // Safe fallback
    }
    
    schema.properties[field] = {
      type: primaryType
    };
    
    if (info.nullable) {
      schema.properties[field].nullable = true;
    }
    
    if (info.required) {
      schema.required.push(field);
    }
    
    // Add format hints
    if (primaryType === 'string' && types.includes('date-time')) {
      schema.properties[field].format = 'date-time';
    }
  });

  return schema;
}

function getJsonType(value: any): string {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    // Check if it's a date
    if (!isNaN(Date.parse(value)) && value.match(/\d{4}-\d{2}-\d{2}/)) {
      return 'date-time';
    }
    return 'string';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}