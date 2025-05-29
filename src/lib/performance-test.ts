// Performance testing utilities
import { perfMonitor } from './performance-monitor';

export interface PerformanceTestResult {
  testName: string;
  metrics: {
    [key: string]: number;
  };
  timestamp: number;
  userAgent: string;
}

class PerformanceTester {
  private results: PerformanceTestResult[] = [];

  async runLoadTest(): Promise<PerformanceTestResult> {
    const testName = 'Page Load Performance';
    const metrics = perfMonitor.getMetrics();
    
    // Calculate derived metrics
    const derivedMetrics = {
      ...metrics,
      totalLoadTime: metrics.fullyLoadedTime || 0,
      gridLoadTime: (metrics.gridInitTime || 0) - (metrics.appStartTime || 0),
      dataGenTime: metrics.dataGenerationTime || 0,
      profileLoadOverhead: metrics.profileLoadTime || 0,
      perceivedLoadTime: metrics.firstRenderTime || 0,
    };

    const result: PerformanceTestResult = {
      testName,
      metrics: derivedMetrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    this.results.push(result);
    return result;
  }

  async runProfileSwitchTest(profileId: string): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    
    // This would need to be integrated with the actual profile switching logic
    // For now, we'll just measure the time it takes to switch profiles
    
    const endTime = performance.now();
    const switchTime = endTime - startTime;

    const result: PerformanceTestResult = {
      testName: 'Profile Switch Performance',
      metrics: {
        profileSwitchTime: switchTime,
        profileId: profileId.length, // Just for reference
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    this.results.push(result);
    return result;
  }

  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  generateReport(): string {
    const report = ['# Performance Test Report', ''];
    
    this.results.forEach((result, index) => {
      report.push(`## Test ${index + 1}: ${result.testName}`);
      report.push(`Timestamp: ${new Date(result.timestamp).toISOString()}`);
      report.push('');
      report.push('### Metrics:');
      
      Object.entries(result.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          report.push(`- ${key}: ${value.toFixed(2)}ms`);
        }
      });
      
      report.push('');
    });

    // Summary statistics
    if (this.results.length > 0) {
      report.push('## Summary');
      report.push('');
      
      const loadTests = this.results.filter(r => r.testName === 'Page Load Performance');
      if (loadTests.length > 0) {
        const avgTotalLoad = loadTests.reduce((sum, test) => 
          sum + (test.metrics.totalLoadTime || 0), 0) / loadTests.length;
        const avgPerceivedLoad = loadTests.reduce((sum, test) => 
          sum + (test.metrics.perceivedLoadTime || 0), 0) / loadTests.length;
        
        report.push(`- Average Total Load Time: ${avgTotalLoad.toFixed(2)}ms`);
        report.push(`- Average Perceived Load Time: ${avgPerceivedLoad.toFixed(2)}ms`);
      }
    }

    return report.join('\n');
  }

  logReport(): void {
    console.group('📊 Performance Test Report');
    
    this.results.forEach((result, index) => {
      console.group(`Test ${index + 1}: ${result.testName}`);
      console.table(result.metrics);
      console.log('Timestamp:', new Date(result.timestamp).toISOString());
      console.groupEnd();
    });
    
    console.groupEnd();
  }
}

export const perfTester = new PerformanceTester();

// Export to window for easy access
if (typeof window !== 'undefined') {
  (window as any).perfTester = perfTester;
  
  // Add convenience methods
  (window as any).runPerfTest = async () => {
    const result = await perfTester.runLoadTest();
    perfTester.logReport();
    return result;
  };
  
  (window as any).getPerfReport = () => {
    return perfTester.generateReport();
  };
}