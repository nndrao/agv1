import React from 'react';
import { AppContainer } from '@/components/container/AppContainer';
import { DockviewContainer } from '@/components/container/DockviewContainer';

export const AppWithContainer: React.FC = () => {
  return (
    <AppContainer>
      <DockviewContainer className="h-full w-full" />
    </AppContainer>
  );
};