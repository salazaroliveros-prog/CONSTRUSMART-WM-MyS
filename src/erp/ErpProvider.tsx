import React from 'react';
import { ErpProvider as OriginalErpProvider } from './store';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/hooks/useAuth';

/**
 * Wrapper que conecta useAuth con ErpProvider
 * Expone signIn/signUp/signInWithGoogle/logout funcionales
 */
export const ErpProviderWithAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <OriginalErpProvider>{children}</OriginalErpProvider>;
};

export default ErpProviderWithAuth;