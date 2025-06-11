# DataSource Configuration Dialog Requirements

Create a floating dialog box that allows users to configure and manage multiple data sources for an AG-Grid component. The dialog should support both STOMP server and REST endpoint connections.

## Core Features

### 1. Data Source Types
- **STOMP Server Connection**: Real-time WebSocket-based data streaming
- **REST Endpoint Connection**: HTTP-based data fetching

### 2. STOMP Server Configuration
The user should be able to configure:
- **WebSocket Connection String**: URL for the STOMP server connection
- **Topic**: Subscription topic for listening to incoming messages
- **Trigger Message**: Message to send to the STOMP server to initiate data publishing
- **Snapshot Token**: Signal indicating the end of initial data load from the server
- **Data Source Name**: Human-readable identifier for this connection

### 3. REST Endpoint Configuration
The user should be able to configure:
- **Endpoint URL**: REST API endpoint for data fetching
- **HTTP Method**: GET, POST, etc.
- **Headers**: Custom headers for authentication/configuration
- **Request Body**: For POST requests (if applicable)
- **Data Source Name**: Human-readable identifier for this connection

### 4. Schema Management
- **Manual Schema Input**: Allow users to paste JSON schema directly
- **Automatic Schema Inference**: When no schema is provided:
  - Fetch a large sample of data to ensure comprehensive schema detection
  - Analyze nested objects and arrays to build complete schema
  - Handle edge cases where some fields may be occasionally null/undefined
  - Present inferred schema to user for validation/modification

### 5. Column Definition Builder
- Display the JSON schema in a user-friendly interface
- Allow users to select/deselect fields from the schema
- Enable customization of column properties:
  - Display name
  - Data type
  - Sorting/filtering options
  - Custom rendering
- Generate AG-Grid column definitions based on user selections
- Provide preview of how data will appear in the grid

### 6. Data Source Management
- **Multiple Sources**: Support creating and managing multiple data sources
- **Active Status**: Allow marking data sources as active/inactive
- **Testing**: "Fetch" button to test connection and preview data
- **Validation**: Ensure all required fields are filled before allowing save

### 7. Persistence Strategy
- **Grid Level**: Save all configured data sources (active and inactive) at the grid/component level
- **Profile Level**: Save only active data sources at the user profile level for automatic loading
- **Auto-load**: When the application starts, automatically fetch data from active data sources

## Technical Considerations

### Error Handling
- Connection timeout handling
- Invalid schema detection
- Network error recovery
- User-friendly error messages

### Performance
- Efficient schema inference with minimal data sampling
- Lazy loading for large datasets
- Connection pooling where applicable

### Security
- Validate WebSocket URLs and REST endpoints
- Sanitize user inputs
- Support authentication mechanisms (tokens, basic auth, etc.)

### User Experience
- Real-time connection status indicators
- Progress indicators during data fetching
- Drag-and-drop for schema files
- Search/filter functionality for large schemas
- Responsive design for different screen sizes

## Interface Requirements

### Layout
- Modal/floating dialog that doesn't block the main interface
- Tabbed interface for different data source types
- Collapsible sections for advanced configuration
- Clear visual distinction between required and optional fields

### Workflow
1. User selects data source type (STOMP/REST)
2. User configures connection parameters
3. User optionally provides JSON schema or leaves blank for auto-inference
4. User clicks "Fetch" to test connection and retrieve sample data
5. System infers schema if not provided and displays it
6. User customizes column definitions from the schema
7. User saves the data source with active/inactive status
8. Data source is persisted according to the persistence strategy

## Success Criteria
- Users can easily configure multiple data sources without technical expertise
- Schema inference accurately captures complex nested data structures
- Column definitions generate correctly formatted AG-Grid configurations
- Active data sources automatically populate the grid on application load
- All configurations persist correctly across sessions