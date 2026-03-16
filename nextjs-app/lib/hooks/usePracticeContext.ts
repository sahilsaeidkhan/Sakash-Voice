'use client';

import { useContext } from 'react';
import { PracticeContext, PracticeContextType } from '@/lib/contexts/PracticeContext';

export function usePracticeContext(): PracticeContextType {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePracticeContext must be used within PracticeProvider');
  }
  return context;
}
