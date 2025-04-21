// Here is the flow: 
// 1. UserA creates and invitations. This invitation is become visible to other players.
// 1.1 UserA can cancel his own invitation at any point before confirmation.
// 2. Users can send acks to the invitation selecting time slots and places that are available to them. Lets assume that UserB and UserC send their acks.
// 3. Those acks are visible to UserA. UserA can now select one of the acks and confirm the reservation.
// 4. UserA selects the ack of UserB. User A must make a reservation at the mutually agreed location and time. After reservation userA commits the ack of userB.
// 4.1 If userA fails to make a reservation then Acks transitions into ReservationFailed state.
// 5. UserC ack transitions into rejected state. 
// 6. After the game date/time has passed, the invitation transitions to Completed state.
// On that step the flow of the invitation is completed.

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
  confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<ApiConfirmation>;
  listEvents(): Promise<ListEventsResponse>;
  listPublicEvents(): Promise<ListEventsResponse>;
  joinEvent(eventId: string, request: JoinEventRequest): Promise<ApiJoinRequest>;

  // Location endpoints
  listLocations(): Promise<ApiLocation[]>;
}
