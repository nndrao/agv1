import React from 'react';
import { StylingCustomContentV2 as StylingCustomContent } from '../tabs/StylingCustomContentV2';
import { GeneralCustomContent } from '../tabs/GeneralCustomContent';
import { FormatCustomContent } from '../tabs/FormatCustomContent';
import { FilterCustomContent } from '../tabs/FilterCustomContent';
import { EditorCustomContent } from '../tabs/EditorCustomContent';
import type { RibbonContentProps } from '../../types';

export const CustomContent: React.FC<RibbonContentProps> = ({
  activeTab,
  selectedColumns,
  formatCategory,
  setFormatCategory,
  currentFormat,
  setCurrentFormat,
  showConditionalDialog,
  setShowConditionalDialog,
  advancedFilterTab,
  setAdvancedFilterTab
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="p-3">
            <GeneralCustomContent selectedColumns={selectedColumns} />
          </div>
        );
        
      case 'styling':
        return (
          <div className="p-3">
            <StylingCustomContent selectedColumns={selectedColumns} />
          </div>
        );
        
      case 'format':
        return (
          <div className="p-3">
            <FormatCustomContent 
              selectedColumns={selectedColumns}
              formatCategory={formatCategory}
              setFormatCategory={setFormatCategory}
              currentFormat={currentFormat}
              setCurrentFormat={setCurrentFormat}
              showConditionalDialog={showConditionalDialog}
              setShowConditionalDialog={setShowConditionalDialog}
            />
          </div>
        );
        
      case 'filter':
        return (
          <div className="p-3">
            <FilterCustomContent 
              selectedColumns={selectedColumns}
              advancedFilterTab={advancedFilterTab}
              setAdvancedFilterTab={setAdvancedFilterTab}
            />
          </div>
        );
        
      case 'editor':
        return (
          <div className="p-3">
            <EditorCustomContent selectedColumns={selectedColumns} />
          </div>
        );
        
      default:
        return null;
    }
  };

  return <div className="ribbon-content">{renderTabContent()}</div>;
}; 