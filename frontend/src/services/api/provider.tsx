import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { APIClient, APIConfig } from './types';
import { MockAPIClient } from './mock';
import { RealAPIClient } from './service';

const APIContext = createContext<APIClient | null>(null);

interface APIProviderProps {
  children: ReactNode;
  useMock?: boolean;
  baseUrl?: string;
}

export function APIProvider({ children, useMock = true, baseUrl = '/api' }: APIProviderProps) {
  const { getToken } = useAuth();

  const client = useMemo(() => {
    const config: APIConfig = {
      baseUrl,
      async getAuthToken() {
        try {
          return await getToken() || undefined;
        } catch {
          return undefined;
        }
      }
    };

    return useMock ? new MockAPIClient(config) : new RealAPIClient(config);
  }, [baseUrl, getToken, useMock]);

  return (
    <APIContext.Provider value={client}>
      {children}
    </APIContext.Provider>
  );
}

export function useAPI(): APIClient {
  const client = useContext(APIContext);
  if (!client) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return client;
} 