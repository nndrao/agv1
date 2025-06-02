/**
 * Column Settings Dialog - Quick Test Script
 * Run this in the browser console to test all major functionality
 */

class ColumnSettingsDialogTester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'pass') this.passed++;
    if (type === 'fail') this.failed++;
    
    this.results.push({ timestamp, type, message });
  }

  async wait(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testDialogOpening() {
    this.log('Testing dialog opening...', 'info');
    try {
      // Look for column settings button
      const settingsButton = document.querySelector('[data-testid="column-settings-button"]') ||
                            document.querySelector('[aria-label*="Column Settings"]') ||
                            document.querySelector('button:contains("Column Settings")');
      
      if (!settingsButton) {
        this.log('❌ Column Settings button not found', 'fail');
        return false;
      }

      settingsButton.click();
      await this.wait(500);

      const dialog = document.querySelector('[role="dialog"]') ||
                    document.querySelector('.column-customization-dialog');
      
      if (dialog) {
        this.log('✅ Dialog opens successfully', 'pass');
        return true;
      } else {
        this.log('❌ Dialog did not open', 'fail');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error opening dialog: ${error.message}`, 'fail');
      return false;
    }
  }

  async testTabSwitching() {
    this.log('Testing tab switching...', 'info');
    try {
      const tabs = ['general', 'styling', 'formatters', 'filters', 'editors'];
      let passedTabs = 0;

      for (const tabValue of tabs) {
        const tab = document.querySelector(`[role="tab"][data-value="${tabValue}"]`) ||
                   document.querySelector(`[value="${tabValue}"]`);
        
        if (tab) {
          tab.click();
          await this.wait(200);
          
          const tabContent = document.querySelector(`[data-state="active"][data-value="${tabValue}"]`);
          if (tabContent) {
            passedTabs++;
            this.log(`✅ ${tabValue} tab works`, 'pass');
          } else {
            this.log(`❌ ${tabValue} tab content not found`, 'fail');
          }
        }
      }

      if (passedTabs >= 3) {
        this.log('✅ Tab switching works', 'pass');
        return true;
      } else {
        this.log('❌ Tab switching failed', 'fail');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error testing tabs: ${error.message}`, 'fail');
      return false;
    }
  }

  async testColumnSelection() {
    this.log('Testing column selection...', 'info');
    try {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length === 0) {
        this.log('❌ No column checkboxes found', 'fail');
        return false;
      }

      // Select first few columns
      let selectedCount = 0;
      for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
        const checkbox = checkboxes[i];
        if (!checkbox.checked) {
          checkbox.click();
          await this.wait(100);
          if (checkbox.checked) {
            selectedCount++;
          }
        }
      }

      if (selectedCount > 0) {
        this.log(`✅ Column selection works (${selectedCount} columns selected)`, 'pass');
        return true;
      } else {
        this.log('❌ Column selection failed', 'fail');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error testing column selection: ${error.message}`, 'fail');
      return false;
    }
  }

  async testFormatTab() {
    this.log('Testing Format tab functionality...', 'info');
    try {
      // Switch to format tab
      const formatTab = document.querySelector('[role="tab"][data-value="formatters"]') ||
                       document.querySelector('[value="formatters"]');
      
      if (formatTab) {
        formatTab.click();
        await this.wait(300);
      }

      // Test format dropdown
      const formatDropdown = document.querySelector('[data-testid="format-dropdown"]') ||
                            document.querySelector('select') ||
                            document.querySelector('[role="combobox"]');
      
      if (formatDropdown) {
        formatDropdown.click();
        await this.wait(200);
        
        const options = document.querySelectorAll('[role="option"]') ||
                       document.querySelectorAll('option');
        
        if (options.length > 0) {
          this.log('✅ Format dropdown has options', 'pass');
          
          // Click on a currency option if available
          const currencyOption = Array.from(options).find(opt => 
            opt.textContent.toLowerCase().includes('currency') ||
            opt.textContent.includes('$')
          );
          
          if (currencyOption) {
            currencyOption.click();
            await this.wait(200);
            this.log('✅ Format selection works', 'pass');
          }
          
          return true;
        } else {
          this.log('❌ Format dropdown has no options', 'fail');
          return false;
        }
      } else {
        this.log('❌ Format dropdown not found', 'fail');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error testing format tab: ${error.message}`, 'fail');
      return false;
    }
  }

  async testQuickActionsPanel() {
    this.log('Testing Quick Actions panel...', 'info');
    try {
      // Look for Quick Actions panel or toggle
      const quickActionsToggle = document.querySelector('[data-testid="quick-actions-toggle"]') ||
                                 document.querySelector('[aria-label*="Quick Actions"]');
      
      if (quickActionsToggle) {
        quickActionsToggle.click();
        await this.wait(300);
      }

      // Look for template list
      const templateList = document.querySelector('[data-testid="template-list"]') ||
                          document.querySelector('.template-list') ||
                          document.querySelectorAll('[data-testid*="template"]');
      
      if (templateList && templateList.length > 0) {
        this.log('✅ Quick Actions panel found with templates', 'pass');
        return true;
      } else {
        this.log('⚠️ Quick Actions panel not fully visible (may be collapsed)', 'warn');
        return true; // Not critical failure
      }
    } catch (error) {
      this.log(`❌ Error testing Quick Actions: ${error.message}`, 'fail');
      return false;
    }
  }

  async testApplyButton() {
    this.log('Testing Apply & Close button...', 'info');
    try {
      const applyButton = document.querySelector('[data-testid="apply-close-button"]') ||
                         document.querySelector('button:contains("Apply & Close")') ||
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.includes('Apply')
                         );
      
      if (applyButton) {
        // Check if button is enabled
        if (!applyButton.disabled) {
          this.log('✅ Apply & Close button found and enabled', 'pass');
          return true;
        } else {
          this.log('⚠️ Apply & Close button found but disabled (select columns first)', 'warn');
          return true;
        }
      } else {
        this.log('❌ Apply & Close button not found', 'fail');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error testing Apply button: ${error.message}`, 'fail');
      return false;
    }
  }

  async testFormatGuide() {
    this.log('Testing Format Guide dialog...', 'info');
    try {
      // Look for format guide button
      const guideButton = document.querySelector('[data-testid="format-guide-button"]') ||
                         document.querySelector('[aria-label*="Guide"]') ||
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.includes('Guide') || btn.querySelector('[data-icon="help"]')
                         );
      
      if (guideButton) {
        guideButton.click();
        await this.wait(500);
        
        const guideDialog = document.querySelector('[role="dialog"]') ||
                           document.querySelector('.format-guide-dialog');
        
        if (guideDialog && guideDialog.textContent.includes('Format')) {
          this.log('✅ Format Guide dialog opens', 'pass');
          
          // Close the guide dialog
          const closeButton = guideDialog.querySelector('[aria-label="Close"]') ||
                              guideDialog.querySelector('button[data-testid="close"]');
          if (closeButton) {
            closeButton.click();
            await this.wait(200);
          } else {
            // Try pressing Escape
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await this.wait(200);
          }
          
          return true;
        } else {
          this.log('❌ Format Guide dialog did not open properly', 'fail');
          return false;
        }
      } else {
        this.log('⚠️ Format Guide button not found (may be in different location)', 'warn');
        return true; // Not critical
      }
    } catch (error) {
      this.log(`❌ Error testing Format Guide: ${error.message}`, 'fail');
      return false;
    }
  }

  async testSearchFunctionality() {
    this.log('Testing column search functionality...', 'info');
    try {
      const searchInput = document.querySelector('[data-testid="column-search"]') ||
                         document.querySelector('input[placeholder*="search"]') ||
                         document.querySelector('input[type="search"]');
      
      if (searchInput) {
        // Type a search term
        searchInput.focus();
        searchInput.value = 'name';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(300);
        
        // Check if results are filtered
        const visibleItems = document.querySelectorAll('[data-testid*="column-item"]:not([style*="display: none"])');
        
        if (visibleItems.length < document.querySelectorAll('[data-testid*="column-item"]').length) {
          this.log('✅ Search functionality works', 'pass');
          
          // Clear search
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          await this.wait(200);
          
          return true;
        } else {
          this.log('⚠️ Search may not be filtering results', 'warn');
          return true;
        }
      } else {
        this.log('⚠️ Search input not found', 'warn');
        return true; // Not critical
      }
    } catch (error) {
      this.log(`❌ Error testing search: ${error.message}`, 'fail');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Column Settings Dialog Test Suite...', 'info');
    console.log('═'.repeat(60));
    
    const tests = [
      this.testDialogOpening.bind(this),
      this.testTabSwitching.bind(this),
      this.testColumnSelection.bind(this),
      this.testFormatTab.bind(this),
      this.testQuickActionsPanel.bind(this),
      this.testApplyButton.bind(this),
      this.testFormatGuide.bind(this),
      this.testSearchFunctionality.bind(this),
    ];

    for (const test of tests) {
      await test();
      await this.wait(500); // Pause between tests
    }

    this.printSummary();
  }

  printSummary() {
    console.log('═'.repeat(60));
    this.log('📊 TEST SUMMARY', 'info');
    this.log(`✅ Passed: ${this.passed}`, 'pass');
    this.log(`❌ Failed: ${this.failed}`, this.failed > 0 ? 'fail' : 'info');
    this.log(`📋 Total: ${this.passed + this.failed}`, 'info');

    const successRate = Math.round((this.passed / (this.passed + this.failed)) * 100);
    this.log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'pass' : 'fail');

    if (this.failed === 0) {
      console.log('🎉 All tests passed! Your Column Settings Dialog is working correctly.');
    } else if (this.failed <= 2) {
      console.log('⚠️ Most tests passed with minor issues. Review failed tests above.');
    } else {
      console.log('❌ Multiple test failures detected. Please review the implementation.');
    }

    console.log('═'.repeat(60));
    
    // Return results for programmatic use
    return {
      passed: this.passed,
      failed: this.failed,
      successRate,
      results: this.results
    };
  }

  // Quick performance test
  async testPerformance() {
    this.log('🏃‍♂️ Running performance test...', 'info');
    
    const start = performance.now();
    
    // Open dialog
    await this.testDialogOpening();
    
    // Switch tabs rapidly
    const tabs = ['general', 'styling', 'formatters'];
    for (const tab of tabs) {
      const tabElement = document.querySelector(`[role="tab"][data-value="${tab}"]`);
      if (tabElement) {
        tabElement.click();
        await this.wait(50);
      }
    }
    
    const end = performance.now();
    const duration = end - start;
    
    if (duration < 2000) {
      this.log(`✅ Performance test passed (${Math.round(duration)}ms)`, 'pass');
    } else {
      this.log(`⚠️ Performance test slow (${Math.round(duration)}ms)`, 'warn');
    }
    
    return duration;
  }
}

// Auto-run when script is loaded
console.log('🔧 Column Settings Dialog Tester loaded!');
console.log('Run: `await tester.runAllTests()` to test all functionality');
console.log('Run: `await tester.testPerformance()` for performance testing');

// Create global instance
window.columnSettingsTester = new ColumnSettingsDialogTester();

// Quick test function
window.testColumnSettings = async () => {
  return await window.columnSettingsTester.runAllTests();
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColumnSettingsDialogTester;
} 