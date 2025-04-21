import { APIConfig } from '../types/api';
import { components } from '../types/schema';

// Define types based on the schema
type Event = components['schemas']['ApiEvent'];
type EventConfirmation = components['schemas']['ApiConfirmation'];
type JoinRequest = components['schemas']['ApiJoinRequest'];
type Location = components['schemas']['ApiLocation'];

// Response types
type ListEventsResponse = components['schemas']['ApiListEventsResponse'];
type CreateEventResponse = components['schemas']['ApiCreateEventResponse'];
type GetEventResponse = components['schemas']['ApiGetEventResponse'];
type ConfirmEventResponse = components['schemas']['ApiEventConfirmationResponse'];
type JoinRequestResponse = components['schemas']['ApiJoinRequestResponse'];
type ListLocationsResponse = components['schemas']['ApiListLocationsResponse'];

// Request types
type CreateEventRequest = {
  event: components['schemas']['ApiEventData'];
};

type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

type JoinEventRequest = {
  joinRequest: components['schemas']['ApiJoinRequestData'];
};

export interface APIError {
  message: string;
  status: number;
}

export class HTTPError extends Error implements APIError {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HTTPError';
  }
}

export class RealAPIClient {
  constructor(private config: APIConfig) {}

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.config.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new HTTPError(response.status, await response.text());
    }

    return response.json();
  }

  async createEvent(request: CreateEventRequest): Promise<Event> {
    const response = await this.fetch<CreateEventResponse>('/api/events/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.event!;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.fetch(`/api/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getEvent(id: string): Promise<Event> {
    const response = await this.fetch<GetEventResponse>(`/api/events/${id}`);
    return response.event!;
  }

  async confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation> {
    const response = await this.fetch<ConfirmEventResponse>(`/api/events/${eventId}/confirmation`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.confirmation!;
  }

  async listEvents(): Promise<ListEventsResponse> {
    return this.fetch<ListEventsResponse>('/api/events/');
  }

  async joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest> {
    const response = await this.fetch<JoinRequestResponse>(`/api/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.joinRequest!;
  }

  async listLocations(): Promise<Location[]> {
    const response = await this.fetch<ListLocationsResponse>('/api/locations/');
    return response.locations || [];
  }

  async listPublicEvents(): Promise<ListEventsResponse> {
    return this.fetch<ListEventsResponse>('/api/events/public');
  }
}