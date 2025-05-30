import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { components } from '../types/schema';
import { MockAPIClient } from './mockApi';
import { RealAPIClient } from './realApi';
import { APIClient, APIConfig } from '../types/api';

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

export function APIProvider({ children, useMock = true, baseUrl = '' }: APIProviderProps) {
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