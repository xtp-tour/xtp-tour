import { APIConfig, APIError, ApiEvent, ApiConfirmation, ApiJoinRequest, ApiLocation, ListEventsResponse, CreateEventResponse, GetEventResponse, ConfirmEventResponse, JoinRequestResponse, ListLocationsResponse, CreateEventRequest, ConfirmEventRequest, JoinEventRequest } from '../types/api';

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

  async createEvent(request: CreateEventRequest): Promise<ApiEvent> {
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

  async getEvent(id: string): Promise<ApiEvent> {
    const response = await this.fetch<GetEventResponse>(`/api/events/${id}`);
    return response.event!;
  }

  async confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<ApiConfirmation> {
    const response = await this.fetch<ConfirmEventResponse>(`/api/events/${eventId}/confirmation`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.confirmation!;
  }

  async listEvents(): Promise<ListEventsResponse> {
    return this.fetch<ListEventsResponse>('/api/events/');
  }

  async joinEvent(eventId: string, request: JoinEventRequest): Promise<ApiJoinRequest> {
    const response = await this.fetch<JoinRequestResponse>(`/api/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.joinRequest!;
  }

  async listLocations(): Promise<ApiLocation[]> {
    const response = await this.fetch<ListLocationsResponse>('/api/locations/');
    return response.locations || [];
  }

  async listPublicEvents(): Promise<ListEventsResponse> {
    return this.fetch<ListEventsResponse>('/api/events/public');
  }

  async listJoinedEvents(): Promise<ListEventsResponse> {
    return this.fetch<ListEventsResponse>('/api/events/joined');
  }
}