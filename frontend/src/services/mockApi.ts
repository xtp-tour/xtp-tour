import { APIConfig, ListEventsResponse, GetUserProfileResponse, CreateUserProfileRequest, CreateUserProfileResponse, UpdateUserProfileRequest, UpdateUserProfileResponse, CalendarAuthURLResponse, CalendarCallbackRequest, CalendarConnectionStatusResponse, CalendarPreferencesRequest, CalendarPreferencesResponse, ApiUserCalendar } from '../types/api';
import { components } from '../types/schema';
import moment from 'moment';
import { formatLocalToUtc } from '../utils/dateUtils';

// Define types based on the schema
type Event = components['schemas']['ApiEvent'];
type EventConfirmation = components['schemas']['ApiConfirmation'];
type JoinRequest = components['schemas']['ApiJoinRequest'];
type Location = components['schemas']['ApiLocation'];



// Request types
type CreateEventRequest = {
  event: components['schemas']['ApiEventData'];
};

type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

type JoinEventRequest = {
  joinRequest: components['schemas']['ApiJoinRequestData'];
};

// Debug information interface
interface DebugInfo {
  timestamp: string;
  userAgent: string;
  screenSize: {
    width: number;
    height: number;
  };
  url: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  statusCode?: number;
  requestData?: unknown;
  responseData?: string;
}

// Function to collect anonymous debugging information
function collectDebugInfo(error: Error, extraInfo?: {
  apiEndpoint?: string;
  apiMethod?: string;
  statusCode?: number;
  requestData?: unknown;
  responseData?: string;
}): DebugInfo {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    url: window.location.href,
    errorType: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    ...extraInfo
  };
}

// Silent error reporter for mock implementation
class MockSilentErrorReporter {
  private static instance: MockSilentErrorReporter;
  private reportQueue: DebugInfo[] = [];
  private isReporting = false;

  private constructor() {}

  static getInstance(): MockSilentErrorReporter {
    if (!MockSilentErrorReporter.instance) {
      MockSilentErrorReporter.instance = new MockSilentErrorReporter();
    }
    return MockSilentErrorReporter.instance;
  }

  private async processQueue() {
    if (this.isReporting || this.reportQueue.length === 0) return;

    this.isReporting = true;
    while (this.reportQueue.length > 0) {
      const debugInfo = this.reportQueue.shift();
      if (!debugInfo) continue;

      try {
        // In mock implementation, just log to console in development
        if (import.meta.env.DEV) {
          console.log('Mock error report:', debugInfo);
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      } catch {
        // Silently ignore any errors in error reporting
      }
    }
    this.isReporting = false;
  }

  report(error: Error, extraInfo?: {
    apiEndpoint?: string;
    apiMethod?: string;
    statusCode?: number;
    requestData?: unknown;
    responseData?: string;
  }) {
    try {
      const debugInfo = collectDebugInfo(error, extraInfo);
      this.reportQueue.push(debugInfo);
      // Process queue asynchronously
      setTimeout(() => this.processQueue(), 0);
    } catch {
      // Silently ignore any errors in error collection
    }
  }
}

class MockAPIError extends Error {
  public code: string;
  public details?: Record<string, unknown>;
  public statusCode: number;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MockAPIError';
    this.code = code;
    this.details = details;
    this.statusCode = code === 'NOT_FOUND' ? 404 :
                      code === 'UNAUTHORIZED' ? 401 :
                      code === 'FORBIDDEN' ? 403 : 500;
  }
}

const STORAGE_KEY = 'xtp_mock_invitations';

const MOCK_LOCATIONS: Location[] = [
  {
    id: 'central_park',
    name: 'Central Park Tennis Courts',
    address: '123 Central Park West',
    coordinates: {
      latitude: 40.7829,
      longitude: -73.9654
    }
  },
  {
    id: 'riverside',
    name: 'Riverside Tennis Center',
    address: '456 Riverside Dr',
    coordinates: {
      latitude: 40.8029,
      longitude: -73.9654
    }
  },
  {
    id: 'east_side',
    name: 'East Side Tennis Club',
    address: '789 East End Ave',
    coordinates: {
      latitude: 40.7729,
      longitude: -73.9454
    }
  },
];

const MOCK_MY_INVITATIONS: Event[] = [
  {
    id: '1',
    userId: 'current_user',
    locations: ['central_park', 'riverside'],
    skillLevel: 'INTERMEDIATE',
    eventType: 'MATCH',
    expectedPlayers: 2,
    sessionDuration: 2,
    timeSlots: [
      // UTC ISO 8601 formatted timestamps
      moment().add(1, 'day').set({ hour: 10, minute: 0 }).utc().toISOString(),
      moment().add(1, 'day').set({ hour: 14, minute: 0 }).utc().toISOString()
    ],
    description: 'Accepted Invitation. Looking for a friendly match, prefer baseline rallies',
    status: 'OPEN',
    createdAt: moment().toISOString(),
    visibility: 'PUBLIC',
    joinRequests: [
      {
        id: '1',
        userId: 'other_user',
        eventId: '1',
        locations: ['central_park'],
        timeSlots: [moment().add(1, 'day').set({ hour: 10, minute: 0 }).utc().toISOString()], // UTC format
        isRejected: null,
        createdAt: moment().toISOString()
      },
      {
        id: '2',
        userId: 'john_doe',
        eventId: '1',
        locations: ['riverside'],
        timeSlots: [moment().add(1, 'day').set({ hour: 14, minute: 0 }).toISOString()],
        isRejected: null,
        createdAt: moment().toISOString()
      },
    ]
  },
  {
    id: '2',
    userId: 'current_user',
    locations: ['riverside'],
    skillLevel: 'ADVANCED',
    eventType: 'TRAINING',
    expectedPlayers: 2,
    sessionDuration: 1.5,
    timeSlots: [moment().add(2, 'days').set({ hour: 16, minute: 0 }).toISOString()],
    description: 'Want to practice serves and returns',
    status: 'OPEN',
    createdAt: moment().subtract(1, 'day').toISOString(),
    visibility: 'PUBLIC',
    joinRequests: []
  },
];

const MOCK_OTHER_INVITATIONS: Event[] = [
  {
    id: '3',
    userId: 'john_doe',
    locations: ['east_side'],
    skillLevel: 'BEGINNER',
    eventType: 'TRAINING',
    expectedPlayers: 2,
    sessionDuration: 1,
    timeSlots: [
      moment().add(3, 'days').set({ hour: 9, minute: 0 }).toISOString(),
      moment().add(3, 'days').set({ hour: 11, minute: 0 }).toISOString()
    ],
    description: 'New to tennis, looking for someone to practice basic strokes with',
    status: 'OPEN',
    createdAt: moment().subtract(2, 'hours').toISOString(),
    visibility: 'PUBLIC',
    joinRequests: [
      {
        id: 'current_user_join_request',
        userId: 'current_user',
        eventId: '3',
        locations: ['east_side'],
        timeSlots: [moment().add(3, 'days').set({ hour: 9, minute: 0 }).toISOString()],
        isRejected: null,
        createdAt: moment().toISOString()
      }
    ]
  },
  {
    id: '4',
    userId: 'sarah_smith',
    locations: ['central_park', 'riverside'],
    skillLevel: 'INTERMEDIATE',
    eventType: 'MATCH',
    expectedPlayers: 4,
    sessionDuration: 1.5,
    timeSlots: [moment().add(4, 'days').set({ hour: 15, minute: 0 }).toISOString()],
    description: 'Looking for competitive matches, NTRP 4.0',
    status: 'OPEN',
    createdAt: moment().subtract(12, 'hours').toISOString(),
    visibility: 'PUBLIC',
    joinRequests: []
  }
];

export interface APIClient {
  // Event endpoints
  createEvent(request: CreateEventRequest): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  getEvent(id: string): Promise<Event>;
  getPublicEvent(id: string): Promise<Event>;
  confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation>;
  listEvents(): Promise<ListEventsResponse>;
  listPublicEvents(): Promise<ListEventsResponse>;
  listJoinedEvents(): Promise<ListEventsResponse>;
  joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest>;
  cancelJoinRequest(eventId: string, joinRequestId: string): Promise<void>;

  // Location endpoints
  listLocations(): Promise<Location[]>;

  // Error reporting
  reportError(error: Error, extraInfo?: {
    apiEndpoint?: string;
    apiMethod?: string;
    statusCode?: number;
    requestData?: unknown;
    responseData?: string;
  }): Promise<void>;

  // Profile endpoints
  getUserProfile(): Promise<GetUserProfileResponse>;
  getUserProfileByUserId(userId: string): Promise<GetUserProfileResponse>;
  createUserProfile(request: CreateUserProfileRequest): Promise<CreateUserProfileResponse>;
  updateUserProfile(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse>;
  deleteUserProfile(): Promise<void>;
  ping(): Promise<{ service?: string; status?: string; message?: string }>;

  // Calendar integration methods
  getCalendarAuthURL(): Promise<CalendarAuthURLResponse>;
  handleCalendarCallback(request: CalendarCallbackRequest): Promise<void>;
  getCalendarConnectionStatus(): Promise<CalendarConnectionStatusResponse>;
  disconnectCalendar(): Promise<void>;
  getBusyTimes(timeMin: string, timeMax: string): Promise<components['schemas']['CalendarBusyTimesResponse']>;
  getCalendars(): Promise<ApiUserCalendar[]>;
  getCalendarPreferences(): Promise<CalendarPreferencesResponse>;
  updateCalendarPreferences(request: CalendarPreferencesRequest): Promise<CalendarPreferencesResponse>;
}

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private myInvitations: Event[];
  private otherInvitations: Event[];
  private locations: Location[] = [...MOCK_LOCATIONS];
  private events: Event[] = [...MOCK_MY_INVITATIONS, ...MOCK_OTHER_INVITATIONS];
  private errorReporter: MockSilentErrorReporter;

  constructor(config: APIConfig) {
    this.config = config;
    this.myInvitations = [...MOCK_MY_INVITATIONS];
    this.otherInvitations = [...MOCK_OTHER_INVITATIONS];
    this.errorReporter = MockSilentErrorReporter.getInstance();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private saveInvitations(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      myInvitations: this.myInvitations,
      otherInvitations: this.otherInvitations
    }));
  }

  private async checkAuth(): Promise<void> {
    const token = await this.config.getAuthToken();
    if (!token) {
      const error = new MockAPIError('UNAUTHORIZED', 'Authentication required');
      this.errorReporter.report(error, {
        apiMethod: 'UNKNOWN',
        statusCode: 401,
        responseData: JSON.stringify({ error: 'Authentication required' })
      });
      throw error;
    }
  }

  async createEvent(request: CreateEventRequest): Promise<Event> {
    try {
      await this.checkAuth();
      await this.delay(500);

      const newEvent: Event = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'current_user',
        ...request.event,
        status: 'OPEN',
        createdAt: moment().toISOString(),
        joinRequests: []
      };

      this.events.push(newEvent);
      this.saveInvitations();
      return newEvent;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: '/api/events/',
        apiMethod: 'POST',
        requestData: request
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation> {
    try {
      await this.checkAuth();
      await this.delay(500);

      const event = this.events.find(e => e.id === eventId);
      if (!event) {
        const error = new MockAPIError('NOT_FOUND', 'Event not found');
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/${eventId}/confirmation`,
          apiMethod: 'POST',
          requestData: request,
          statusCode: 404,
          responseData: JSON.stringify({ error: 'Event not found' })
        });
        throw error;
      }

      const confirmation: EventConfirmation = {
        eventId,
        datetime: request.datetime,
        location: request.locationId,
        createdAt: formatLocalToUtc(new Date()) // Explicitly convert to UTC ISO format
      };

      event.status = 'CONFIRMED';
      event.confirmation = confirmation;
      this.saveInvitations();

      return confirmation;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: `/api/events/${eventId}/confirmation`,
        apiMethod: 'POST',
        requestData: request
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async listEvents(): Promise<ListEventsResponse> {
    try {
      await this.checkAuth();
      await this.delay(500);

      return {
        events: this.events,
        total: this.events.length
      };
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: '/api/events/',
        apiMethod: 'GET'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async listPublicEvents(): Promise<ListEventsResponse> {
    try {
      await this.delay(500);

      const publicEvents = this.events.filter(event => event.visibility === 'PUBLIC' && event.status === 'OPEN');
      return {
        events: publicEvents,
        total: publicEvents.length
      };
    } catch (error) {
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: '/api/events/public',
        apiMethod: 'GET'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest> {
    try {
      await this.checkAuth();
      await this.delay(500);

      const event = this.events.find(e => e.id === eventId);
      if (!event) {
        const error = new MockAPIError('NOT_FOUND', 'Event not found');
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/${eventId}/join`,
          apiMethod: 'POST',
          requestData: request,
          statusCode: 404,
          responseData: JSON.stringify({ error: 'Event not found' })
        });
        throw error;
      }

      const joinRequest: JoinRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'current_user',
        eventId,
        ...request.joinRequest,
        isRejected: null,
        createdAt: new Date().toISOString()
      };

      if (!event.joinRequests) {
        event.joinRequests = [];
      }
      event.joinRequests.push(joinRequest);
      this.saveInvitations();

      return joinRequest;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: `/api/events/${eventId}/join`,
        apiMethod: 'POST',
        requestData: request
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.checkAuth();
      await this.delay(500);

      const eventIndex = this.events.findIndex(e => e.id === id);
      if (eventIndex === -1) {
        const error = new MockAPIError('NOT_FOUND', 'Event not found');
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/${id}`,
          apiMethod: 'DELETE',
          statusCode: 404,
          responseData: JSON.stringify({ error: 'Event not found' })
        });
        throw error;
      }

      this.events.splice(eventIndex, 1);
      this.saveInvitations();
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: `/api/events/${id}`,
        apiMethod: 'DELETE'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async getEvent(id: string): Promise<Event> {
    try {
      await this.checkAuth();
      await this.delay(500);

      const event = this.events.find(e => e.id === id);
      if (!event) {
        const error = new MockAPIError('NOT_FOUND', 'Event not found');
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/${id}`,
          apiMethod: 'GET',
          statusCode: 404,
          responseData: JSON.stringify({ error: 'Event not found' })
        });
        throw error;
      }

      return event;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: `/api/events/${id}`,
        apiMethod: 'GET'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async getPublicEvent(id: string): Promise<Event> {
    try {
      await this.delay(500);

      const event = this.events.find(e => e.id === id && e.visibility === 'PUBLIC');
      if (!event) {
        const error = new MockAPIError('NOT_FOUND', 'Public event not found');
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/public/${id}`,
          apiMethod: 'GET',
          statusCode: 404,
          responseData: JSON.stringify({ error: 'Public event not found' })
        });
        throw error;
      }

      return event;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: `/api/events/public/${id}`,
        apiMethod: 'GET'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async listLocations(): Promise<Location[]> {
    try {
      await this.checkAuth();
      await this.delay(500);
      return this.locations;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: '/api/locations/',
        apiMethod: 'GET'
      });
      throw new MockAPIError('INTERNAL_ERROR', 'Internal server error');
    }
  }

  async listJoinedEvents(): Promise<ListEventsResponse> {
    await this.checkAuth();
    await this.delay(300);
    return {
      events: this.events.filter(event =>
        event.joinRequests?.some(request => request.userId === 'current_user')
      ),
      total: 0
    };
  }

  async cancelJoinRequest(eventId: string, joinRequestId: string): Promise<void> {
    await this.checkAuth();
    await this.delay(300);

    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new MockAPIError('NOT_FOUND', 'Event not found');
    }

    if (!event.joinRequests) {
      throw new MockAPIError('NOT_FOUND', 'No join requests found for this event');
    }

    const joinRequestIndex = event.joinRequests.findIndex(r => r.id === joinRequestId);
    if (joinRequestIndex === -1) {
      throw new MockAPIError('NOT_FOUND', 'Join request not found');
    }

    const joinRequest = event.joinRequests[joinRequestIndex];
    if (joinRequest.userId !== 'current_user') {
      throw new MockAPIError('FORBIDDEN', 'Not authorized to cancel this join request');
    }

    event.joinRequests.splice(joinRequestIndex, 1);
    this.saveInvitations();
  }

  async reportError(error: Error, extraInfo?: {
    apiEndpoint?: string;
    apiMethod?: string;
    statusCode?: number;
    requestData?: unknown;
    responseData?: string;
  }): Promise<void> {
    this.errorReporter.report(error, extraInfo);
  }

  async getUserProfile(): Promise<GetUserProfileResponse> {
    await this.checkAuth();
    await this.delay(300);
    // Mock implementation - simulate profile doesn't exist
    return {
      profile: undefined
    };
  }

  async getUserProfileByUserId(userId: string): Promise<GetUserProfileResponse> {
    await this.delay(300);
    // Mock implementation - return mock profile data
    return {
      userId: userId,
      profile: {
        firstName: `User`,
        lastName: `${userId.slice(-4)}`,
        ntrpLevel: 3.0,
        city: 'Mock City',
        country: 'Poland',
        language: 'en'
      }
    };
  }

  async createUserProfile(request: CreateUserProfileRequest): Promise<CreateUserProfileResponse> {
    await this.checkAuth();
    await this.delay(500);
    // Mock implementation - simulate successful profile creation
    return {
      userId: 'current_user',
      profile: {
        firstName: request.firstName,
        lastName: request.lastName,
        ntrpLevel: request.ntrpLevel,
        city: request.city,
        country: request.country,
        language: request.language,
        notification_settings: request.notification_settings
      }
    };
  }

  async updateUserProfile(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    await this.checkAuth();
    await this.delay(500);
    // Mock implementation - simulate successful profile update
    return {
      userId: 'current_user',
      profile: {
        firstName: request.firstName,
        lastName: request.lastName,
        ntrpLevel: request.ntrpLevel,
        city: request.city,
        country: request.country,
        language: request.language,
        notification_settings: request.notification_settings
      }
    };
  }

  async deleteUserProfile(): Promise<void> {
    await this.checkAuth();
    await this.delay(500);
    // Mock implementation - simulate successful profile deletion
    console.log('Mock: User profile deleted');
  }

  async ping(): Promise<{ service?: string; status?: string; message?: string }> {
    await this.delay(200);
    return {
      service: "mock-xtp-tour@1.0.0",
      status: "OK",
      message: "Mock API is running"
    };
  }

  // Calendar integration mock methods
  async getCalendarAuthURL(): Promise<CalendarAuthURLResponse> {
    await this.delay(200);
    return {
      authUrl: "https://accounts.google.com/oauth/authorize?mock=true"
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleCalendarCallback(_request: CalendarCallbackRequest): Promise<void> {
    await this.delay(500);
    // Mock successful callback handling
  }

  async getCalendarConnectionStatus(): Promise<CalendarConnectionStatusResponse> {
    await this.delay(200);
    return {
      connected: false // Default to disconnected in mock
    };
  }

  async disconnectCalendar(): Promise<void> {
    await this.delay(200);
    // Mock disconnect
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBusyTimes(timeMin: string, timeMax: string): Promise<components['schemas']['CalendarBusyTimesResponse']> {
    await this.delay(200);
    return {
      busyPeriods: [],
    };
  }

  async getCalendars(): Promise<ApiUserCalendar[]> {
    await this.delay(200);
    // Return mock calendars
    return [
      {
        id: "primary",
        summary: "Primary Calendar",
        primary: true
      },
      {
        id: "secondary",
        summary: "Work Calendar",
        primary: false
      }
    ];
  }

  async getCalendarPreferences(): Promise<CalendarPreferencesResponse> {
    await this.delay(200);
    return {
      syncEnabled: true,
      syncFrequencyMinutes: 30,
      showEventDetails: false,
      updatedAt: new Date().toISOString()
    };
  }

  async updateCalendarPreferences(request: CalendarPreferencesRequest): Promise<CalendarPreferencesResponse> {
    await this.delay(200);
    return {
      ...request,
      updatedAt: new Date().toISOString()
    };
  }
}