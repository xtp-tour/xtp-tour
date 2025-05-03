import { components } from "./schema";

// Get types from schema
export type ApiEvent = components['schemas']['ApiEvent'];
export type ApiConfirmation = components['schemas']['ApiConfirmation'];
export type ApiEventStatus = ApiEvent['status'];
export type ApiSkillLevel = components['schemas']['ApiEventData']['skillLevel'];
export type ApiEventType = components['schemas']['ApiEventData']['eventType'];
export type ApiVisibility = components['schemas']['ApiEventData']['visibility'];
export type ApiJoinRequestStatus = components['schemas']['ApiJoinRequest']['status'];
export type ApiLocation = components['schemas']['ApiLocation'];
export type ApiJoinRequest = components['schemas']['ApiJoinRequest'];

// Response types
export type ListEventsResponse = components['schemas']['ApiListEventsResponse'];
export type CreateEventResponse = components['schemas']['ApiCreateEventResponse'];
export type GetEventResponse = components['schemas']['ApiGetEventResponse'];
export type ConfirmEventResponse = components['schemas']['ApiEventConfirmationResponse'];
export type JoinRequestResponse = components['schemas']['ApiJoinRequestResponse'];
export type ListLocationsResponse = components['schemas']['ApiListLocationsResponse'];

// Request types
export type CreateEventRequest = {
  event: components['schemas']['ApiEventData'];
};

export type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

export type JoinEventRequest = {
  joinRequest: components['schemas']['ApiJoinRequestData'];
};

export interface APIError {
  message: string;
  status: number;
}

export interface APIConfig {
  baseUrl: string;
  getAuthToken(): Promise<string | undefined>;
}

export interface APIClient {
  // Event endpoints
  createEvent(request: CreateEventRequest): Promise<ApiEvent>;
  deleteEvent(id: string): Promise<void>;
  getEvent(id: string): Promise<ApiEvent>;
  getPublicEvent(id: string): Promise<ApiEvent>;
  confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<ApiConfirmation>;
  listEvents(): Promise<ListEventsResponse>;
  listPublicEvents(): Promise<ListEventsResponse>;
  listJoinedEvents(): Promise<ListEventsResponse>;
  joinEvent(eventId: string, request: JoinEventRequest): Promise<ApiJoinRequest>;

  // Location endpoints
  listLocations(): Promise<ApiLocation[]>;
}
