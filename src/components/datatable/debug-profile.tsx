import { useProfileStore } from '@/components/datatable/stores/profile.store';
import { Button } from '@/components/ui/button';

export function DebugProfile() {
  const { profiles, activeProfileId } = useProfileStore();
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const debugProfile = () => {
    console.log('=== PROFILE DEBUG ===');
    console.log('Active Profile:', activeProfile);
    console.log('Active Profile ID:', activeProfileId);
    
    if (activeProfile?.gridState.columnDefs) {
      console.log('Column Definitions Count:', activeProfile.gridState.columnDefs.length);
      
      // Show first 5 columns in detail
      const columnsWithCustomizations = activeProfile.gridState.columnDefs.filter(col => {
        const customProps = Object.keys(col).filter(key => 
          !['field', 'headerName', 'width', 'hide', 'colId', 'sort', 'sortIndex'].includes(key)
        );
        return customProps.length > 0;
      });
      
      console.log('Columns with customizations:', columnsWithCustomizations.length);
      
      columnsWithCustomizations.slice(0, 5).forEach((col, idx) => {
        console.log(`Customized Column ${idx}:`, {
          field: col.field,
          headerName: col.headerName,
          hasValueFormatter: !!col.valueFormatter,
          hasCellStyle: !!col.cellStyle,
          hasCellClass: !!col.cellClass,
          hasHeaderClass: !!col.headerClass,
          hasHeaderStyle: !!col.headerStyle,
          hasFilter: !!col.filter,
          cellClass: col.cellClass,
          headerClass: col.headerClass,
          cellStyle: col.cellStyle,
          headerStyle: col.headerStyle,
          cellStyleType: typeof col.cellStyle,
          headerStyleType: typeof col.headerStyle,
          customProperties: Object.keys(col).filter(key => 
            !['field', 'headerName', 'width', 'hide', 'colId', 'sort', 'sortIndex'].includes(key)
          )
        });
      });
    }
    
    // Check localStorage directly
    const storedData = localStorage.getItem('grid-profile-storage');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('Raw localStorage data:', parsed);
      
      // Check specific profile
      const profile = parsed.state.profiles.find((p: any) => p.id === activeProfileId);
      if (profile?.gridState?.columnDefs) {
        const firstColWithStyle = profile.gridState.columnDefs.find((col: any) => col.cellStyle || col.headerStyle);
        if (firstColWithStyle) {
          console.log('First column with styles from localStorage:', {
            field: firstColWithStyle.field,
            cellStyle: firstColWithStyle.cellStyle,
            headerStyle: firstColWithStyle.headerStyle,
            cellClass: firstColWithStyle.cellClass,
            headerClass: firstColWithStyle.headerClass
          });
          
          // Show the actual headerStyle content
          if (firstColWithStyle.headerStyle) {
            console.log('HeaderStyle details:', firstColWithStyle.headerStyle);
          }
        }
        console.log('First column full data:', profile.gridState.columnDefs[0]);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={debugProfile} variant="outline" size="sm">
        Debug Profile
      </Button>
    </div>
  );
}