import React from 'react';
import { ErpProvider as OriginalErpProvider } from './zustandStore';
import { useAuth } from '@/hooks/useAuth';

export const ErpProviderWithAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <OriginalErpProvider>{children}</OriginalErpProvider>;
};

export default ErpProviderWithAuth;
