import { components } from "./schema";

// Get types from schema
export type ApiEvent = components['schemas']['ApiEvent'];
export type ApiConfirmation = components['schemas']['ApiConfirmation'];
export type ApiEventStatus = ApiEvent['status'];
export type ApiSkillLevel = components['schemas']['ApiEventData']['skillLevel'];
export type ApiEventType = components['schemas']['ApiEventData']['eventType'];
export type ApiVisibility = components['schemas']['ApiEventData']['visibility'];
export type ApiLocation = components['schemas']['ApiLocation'];
export type ApiJoinRequest = components['schemas']['ApiJoinRequest'];
export type ApiUserProfileData = components['schemas']['ApiUserProfileData'];

// Response types
export type ListEventsResponse = components['schemas']['ApiListEventsResponse'];
export type CreateEventResponse = components['schemas']['ApiCreateEventResponse'];
export type GetEventResponse = components['schemas']['ApiGetEventResponse'];
export type ConfirmEventResponse = components['schemas']['ApiEventConfirmationResponse'];
export type JoinRequestResponse = components['schemas']['ApiJoinRequestResponse'];
export type ListLocationsResponse = components['schemas']['ApiListLocationsResponse'];
export type GetUserProfileResponse = components['schemas']['ApiGetUserProfileResponse'];
export type CreateUserProfileResponse = components['schemas']['ApiCreateUserProfileResponse'];
export type UpdateUserProfileResponse = components['schemas']['ApiUpdateUserProfileResponse'];

// Request types
export type CreateEventRequest = {
  event: components['schemas']['ApiEventData'];
};

export type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

export type JoinEventRequest = {
  joinRequest: components['schemas']['ApiJoinRequestData'];
};

export type CreateUserProfileRequest = components['schemas']['CreateUserProfileHandler-FmInput'];
export type UpdateUserProfileRequest = components['schemas']['UpdateUserProfileHandler-FmInput'];

export interface APIError {
  message: string;
  status: number;
}

export interface APIConfig {
  baseUrl: string;
  getAuthToken(): Promise<string | undefined>;
}

// Legacy types for backward compatibility - these will be removed once all components are updated
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  username?: string;
  ntrpLevel: number;
  preferredCity: string;
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
  cancelJoinRequest(eventId: string, joinRequestId: string): Promise<void>;

  // Location endpoints
  listLocations(): Promise<ApiLocation[]>;

  // Profile endpoints
  getUserProfile(): Promise<GetUserProfileResponse>;
  getUserProfileByUserId(userId: string): Promise<GetUserProfileResponse>;
  createUserProfile(request: CreateUserProfileRequest): Promise<CreateUserProfileResponse>;
  updateUserProfile(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse>;
  
  // Error reporting
  reportError(error: Error, extraInfo?: {
    apiEndpoint?: string;
    apiMethod?: string;
    statusCode?: number;
    requestData?: unknown;
    responseData?: string;
  }): Promise<void>;
  
  // Legacy profile methods for backward compatibility
  updateProfile(request: UpdateProfileRequest): Promise<void>;
}
