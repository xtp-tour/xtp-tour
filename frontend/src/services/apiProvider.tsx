import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { components } from '../types/schema';
import { MockAPIClient } from './mockApi';
import { RealAPIClient } from './realApi';
import { APIClient, APIConfig } from '../types/api';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Define types based on the schema
export type Event = components['schemas']['ApiEvent'];
export type EventConfirmation = components['schemas']['ApiConfirmation'];
export type JoinRequest = components['schemas']['ApiJoinRequest'];
export type Location = components['schemas']['ApiLocation'];

// Response types
export type ListEventsResponse = components['schemas']['ApiListEventsResponse'];
export type GetEventResponse = components['schemas']['ApiGetEventResponse'];

// Request types
export type CreateEventRequest = {
  event: components['schemas']['ApiEventData'];
};

export type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

export type JoinEventRequest = {
  joinRequest: components['schemas']['ApiJoinRequestData'];
};

const APIContext = createContext<APIClient | null>(null);

interface APIProviderProps {
  children: ReactNode;
  useMock?: boolean;
  baseUrl?: string;
}

// Internal provider that uses Clerk
function APIProviderWithAuth({ children, useMock = true, baseUrl = '' }: APIProviderProps) {
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

// Fallback provider without auth
function APIProviderFallback({ children, baseUrl = '' }: { children: ReactNode; baseUrl?: string }) {
  const client = useMemo(() => {
    const config: APIConfig = {
      baseUrl,
      async getAuthToken() {
        return undefined; // No auth for fallback
      }
    };
    return new MockAPIClient(config);
  }, [baseUrl]);

  return (
    <APIContext.Provider value={client}>
      {children}
    </APIContext.Provider>
  );
}

// Main exported provider
export function APIProvider({ children, useMock = true, baseUrl = '' }: APIProviderProps) {
  // If Clerk is not available, always use mock
  if (!isClerkAvailable) {
    return <APIProviderFallback baseUrl={baseUrl}>{children}</APIProviderFallback>;
  }

  // Force mock when Clerk is not available
  const shouldUseMock = useMock || !isClerkAvailable;

  // Use auth-enabled provider when Clerk is available
  return (
    <APIProviderWithAuth useMock={shouldUseMock} baseUrl={baseUrl}>
      {children}
    </APIProviderWithAuth>
  );
}

export function useAPI(): APIClient {
  const client = useContext(APIContext);
  if (!client) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return client;
}