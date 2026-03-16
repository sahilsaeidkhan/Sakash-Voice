'use client';

import React, { ReactNode } from 'react';
import { PracticeProvider } from '@/lib/contexts/PracticeContext';
import './globals.css';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders
 * Wraps the entire application with necessary context providers
 */
function AppProviders({ children }: AppProvidersProps) {
  return (
    <PracticeProvider>
      {children}
    </PracticeProvider>
  );
}

export default AppProviders;
