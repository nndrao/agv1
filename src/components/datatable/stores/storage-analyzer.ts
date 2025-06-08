import { GridProfile } from './profile.store';
import { calculateCustomizationSize, getCustomizationSummary } from './column-serializer';

export interface StorageAnalysis {
  totalProfiles: number;
  totalSizeKB: number;
  profileAnalysis: {
    profileId: string;
    profileName: string;
    legacySizeKB: number;
    lightweightSizeKB: number;
    savingsKB: number;
    savingsPercent: number;
    customizationSummary?: ReturnType<typeof getCustomizationSummary>;
  }[];
  overallSavings: {
    totalLegacySizeKB: number;
    totalLightweightSizeKB: number;
    totalSavingsKB: number;
    totalSavingsPercent: number;
  };
}

export function analyzeProfileStorage(): StorageAnalysis {
  const storageKey = 'grid-profile-storage';
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    return {
      totalProfiles: 0,
      totalSizeKB: 0,
      profileAnalysis: [],
      overallSavings: {
        totalLegacySizeKB: 0,
        totalLightweightSizeKB: 0,
        totalSavingsKB: 0,
        totalSavingsPercent: 0
      }
    };
  }
  
  const parsedData = JSON.parse(stored);
  const profiles: GridProfile[] = parsedData.state?.profiles || [];
  
  const profileAnalysis = profiles.map(profile => {
    // Calculate legacy size (full columnDefs)
    const legacySize = profile.gridState.columnDefs 
      ? JSON.stringify(profile.gridState.columnDefs).length / 1024
      : 0;
    
    // Calculate lightweight size
    const lightweightSize = profile.gridState.columnCustomizations
      ? calculateCustomizationSize(profile.gridState.columnCustomizations) / 1024
      : 0;
    
    // Get customization summary if using lightweight format
    const customizationSummary = profile.gridState.columnCustomizations
      ? getCustomizationSummary(profile.gridState.columnCustomizations)
      : undefined;
    
    const potentialSavings = legacySize > 0 ? legacySize - lightweightSize : 0;
    const savingsPercent = legacySize > 0 ? (potentialSavings / legacySize) * 100 : 0;
    
    return {
      profileId: profile.id,
      profileName: profile.name,
      legacySizeKB: legacySize,
      lightweightSizeKB: lightweightSize,
      savingsKB: potentialSavings,
      savingsPercent,
      customizationSummary
    };
  });
  
  const totalLegacySizeKB = profileAnalysis.reduce((sum, p) => sum + p.legacySizeKB, 0);
  const totalLightweightSizeKB = profileAnalysis.reduce((sum, p) => sum + p.lightweightSizeKB, 0);
  const totalSavingsKB = totalLegacySizeKB - totalLightweightSizeKB;
  const totalSavingsPercent = totalLegacySizeKB > 0 ? (totalSavingsKB / totalLegacySizeKB) * 100 : 0;
  
  return {
    totalProfiles: profiles.length,
    totalSizeKB: stored.length / 1024,
    profileAnalysis,
    overallSavings: {
      totalLegacySizeKB,
      totalLightweightSizeKB,
      totalSavingsKB,
      totalSavingsPercent
    }
  };
}

export function logStorageAnalysis() {
  const analysis = analyzeProfileStorage();
  
  console.group('🗄️ Profile Storage Analysis');
  console.log(`Total profiles: ${analysis.totalProfiles}`);
  console.log(`Total storage size: ${analysis.totalSizeKB.toFixed(2)} KB`);
  
  console.group('📊 Profile Breakdown');
  analysis.profileAnalysis.forEach(profile => {
    console.group(`📁 ${profile.profileName} (${profile.profileId})`);
    console.log(`Legacy size: ${profile.legacySizeKB.toFixed(2)} KB`);
    console.log(`Lightweight size: ${profile.lightweightSizeKB.toFixed(2)} KB`);
    console.log(`Savings: ${profile.savingsKB.toFixed(2)} KB (${profile.savingsPercent.toFixed(1)}%)`);
    
    if (profile.customizationSummary) {
      console.group('🔧 Customizations');
      console.log(`Customized columns: ${profile.customizationSummary.customizedColumns}`);
      console.log('Property usage:', profile.customizationSummary.properties);
      console.groupEnd();
    }
    
    console.groupEnd();
  });
  console.groupEnd();
  
  console.group('💰 Overall Savings');
  console.log(`Total legacy size: ${analysis.overallSavings.totalLegacySizeKB.toFixed(2)} KB`);
  console.log(`Total lightweight size: ${analysis.overallSavings.totalLightweightSizeKB.toFixed(2)} KB`);
  console.log(`Total savings: ${analysis.overallSavings.totalSavingsKB.toFixed(2)} KB`);
  console.log(`Savings percentage: ${analysis.overallSavings.totalSavingsPercent.toFixed(1)}%`);
  console.groupEnd();
  
  console.groupEnd();
}

// Export function to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).analyzeProfileStorage = logStorageAnalysis;
}