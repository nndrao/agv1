# Testing Profile-Specific Datasource

## How to Test

1. **Start the application**: Run `npm run dev` and open http://localhost:5174/

2. **Create Test Profiles**:
   - Click "Create Test Profiles" button
   - This creates two profiles: "Sales Profile" and "Analytics Profile"

3. **Configure Datasources**:
   - Click "Configure Datasources" button
   - Create different STOMP datasources with different topics/endpoints

4. **Associate Datasource with Profile**:
   - Select a profile from the dropdown (in the DataTable toolbar)
   - Click the three dots menu in the toolbar
   - Select a datasource from the dropdown
   - Click "Save" in the profile menu to save the datasource association

5. **Test Profile Switching**:
   - Use the "Quick Switch" buttons to switch between profiles
   - Notice how the datasource changes when switching profiles
   - The column definitions from the datasource are automatically applied

## Key Features Implemented

1. **Profile-specific datasource storage**: Each profile stores its own datasource ID
2. **Automatic datasource activation**: When switching profiles, the associated datasource is activated
3. **Column definition replacement**: Datasource columns replace existing columns when selected
4. **State reset**: Grid state (filters, sorts) is cleared when switching datasources
5. **Datasource persistence**: Datasource selection is saved with the profile

## Architecture

- `GridProfile` interface now includes `datasourceId?: string`
- `useComponentDatasource` hook manages datasource at profile level
- `useProfileSync` hook triggers datasource changes on profile switch
- `DataTableToolbar` saves datasource ID when saving profile