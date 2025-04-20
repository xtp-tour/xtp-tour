import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { components } from '../types/schema';
import { MockAPIClient } from './mockApi';
import { RealAPIClient } from './realApi';

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

export interface APIConfig {
  baseUrl: string;
  getAuthToken(): Promise<string | undefined>;
}

export interface APIClient {
  // Event endpoints
  createEvent(request: CreateEventRequest): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  getEvent(id: string): Promise<Event>;
  confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation>;
  listEvents(): Promise<ListEventsResponse>;
  joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest>;

  // Location endpoints
  listLocations(): Promise<Location[]>;
}

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