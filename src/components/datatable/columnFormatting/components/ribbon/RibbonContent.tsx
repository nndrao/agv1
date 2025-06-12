import React from 'react';
import { StylingRibbonContent } from '../tabs/StylingRibbonContent';
import { GeneralRibbonContent } from '../tabs/GeneralRibbonContent';
import { FormatRibbonContent } from '../tabs/FormatRibbonContent';
import { FilterRibbonContent } from '../tabs/FilterRibbonContent';
import { EditorRibbonContent } from '../tabs/EditorRibbonContent';
import type { RibbonContentProps } from '../../types';

export const RibbonContent: React.FC<RibbonContentProps> = ({
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
            <GeneralRibbonContent selectedColumns={selectedColumns} />
          </div>
        );
        
      case 'styling':
        return (
          <div className="p-3">
            <StylingRibbonContent selectedColumns={selectedColumns} />
          </div>
        );
        
      case 'format':
        return (
          <div className="p-3">
            <FormatRibbonContent 
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
            <FilterRibbonContent 
              selectedColumns={selectedColumns}
              advancedFilterTab={advancedFilterTab}
              setAdvancedFilterTab={setAdvancedFilterTab}
            />
          </div>
        );
        
      case 'editor':
        return (
          <div className="p-3">
            <EditorRibbonContent selectedColumns={selectedColumns} />
          </div>
        );
        
      default:
        return null;
    }
  };

  return <div className="ribbon-content">{renderTabContent()}</div>;
}; 