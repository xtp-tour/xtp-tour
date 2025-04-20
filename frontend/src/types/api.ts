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


export enum SkillLevel {
  Any = 'ANY',
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Advanced = 'ADVANCED',
}

export enum EventType {
  Match = 'MATCH',
  Training = 'TRAINING',
}

export enum SingleDoubleType {
  Single = 'SINGLE',
  Doubles = 'DOUBLES',
  Custom = 'CUSTOM',
}

export enum EventStatus {
  Open = 'OPEN',
  Accepted = 'ACCEPTED',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
  ReservationFailed = 'RESERVATION_FAILED',
  Completed = 'COMPLETED',
}

export enum JoinRequestStatus {
  Waiting = 'WAITING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED',
  ReservationFailed = 'RESERVATION_FAILED',
}

// That's the record of players accepting an invitation
export interface JoinRequest {
  id: string;
  userId: string;
  locations: string[];
  timeSlots: Date[]; // ISO datetime strings
  status: JoinRequestStatus;
  comment?: string;
  createdAt: string;
}

// When owner reserves the court and confirms the reservation.
export interface EventConfirmation {
  eventId: string;
  datetime: string;
  duration: number;
  location: string;
  createdAt: string;
}

export interface Event {
  id: string;
  userId: string;
  eventType: EventType;
  expectedPlayers: number;
  locations: string[];
  sessionDuration: number;
  skillLevel: SkillLevel;
  timeSlots: Date[]; // ISO datetime strings
  visibility: string;
  description?: string;
  status: EventStatus;
  createdAt: string;
  joinRequests: JoinRequest[];
  confirmation?: EventConfirmation;
  _displayDatetimes?: Date[];
  _displayCreatedAt?: Date;
}

export interface EventData {
  eventType: EventType;
  expectedPlayers: number;
  locations: string[];
  sessionDuration: number;
  skillLevel: SkillLevel;
  timeSlots: Date[]; // ISO datetime strings
  visibility: string;
  description?: string;
  id?: string;
  userId?: string;
}

export interface JoinRequestData {
  locations: string[];
  timeSlots: Date[]; // ISO datetime strings
  comment?: string;
  id?: string;
}

// Locations 
export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ListLocationsResponse {
  locations: Location[];
} 


// end types definitions



// Helper function to determine request type based on number of players
export function getRequestType(expectedPlayers: number): SingleDoubleType {
  switch (expectedPlayers) {
    case 2:
      return SingleDoubleType.Single;
    case 4:
      return SingleDoubleType.Doubles;
    default:
      return SingleDoubleType.Custom;
  }
} 


export interface CreateEventRequest {
  event: EventData;
}

export interface CreateEventResponse {
  event: Event;
}

export interface GetEventResponse {
  event: Event;
}

export interface ConfirmEventResponse {
  confirmation: EventConfirmation;
}

export interface JoinEventRequest {
  joinRequest: JoinRequestData;
}

export interface ConfirmEventRequest {
  datetime: string;
  duration: number;
  joinRequestsIds: string[];
  locationId: string;
}

export interface ListEventsResponse {
  events: Event[];
  total: number;
}

export interface JoinRequestResponse {
  joinRequest: JoinRequest;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
