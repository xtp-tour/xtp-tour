import { APIConfig, APIError, ApiEvent, ApiConfirmation, ApiJoinRequest, ApiLocation, ListEventsResponse, CreateEventResponse, GetEventResponse, ConfirmEventResponse, JoinRequestResponse, ListLocationsResponse, CreateEventRequest, ConfirmEventRequest, JoinEventRequest, GetUserProfileResponse, CreateUserProfileRequest, CreateUserProfileResponse, UpdateUserProfileRequest, UpdateUserProfileResponse, CalendarAuthURLResponse, CalendarCallbackRequest, CalendarConnectionStatusResponse, CalendarBusyTimesRequest, CalendarBusyTimesResponse, CalendarPreferencesRequest, CalendarPreferencesResponse } from '../types/api';

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

// Silent error reporter that never throws
class SilentErrorReporter {
  private static instance: SilentErrorReporter;
  private reportQueue: DebugInfo[] = [];
  private isReporting = false;
  private baseUrl: string;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance(baseUrl: string): SilentErrorReporter {
    if (!SilentErrorReporter.instance) {
      SilentErrorReporter.instance = new SilentErrorReporter(baseUrl);
    }
    return SilentErrorReporter.instance;
  }

  private async processQueue() {
    if (this.isReporting || this.reportQueue.length === 0) return;

    this.isReporting = true;
    while (this.reportQueue.length > 0) {
      const debugInfo = this.reportQueue.shift();
      if (!debugInfo) continue;

      try {
        await fetch(`${this.baseUrl}/api/error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(debugInfo),
        });
      } catch {
        // Silently ignore any errors in error reporting
        // Optionally, we could retry failed reports later
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

export class HTTPError extends Error implements APIError {
  public statusCode: number;
  public responseText: string;

  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HTTPError';
    this.statusCode = status;
    this.responseText = message;
  }
}

export class RealAPIClient {
  private errorReporter: SilentErrorReporter;

  constructor(private config: APIConfig) {
    this.errorReporter = SilentErrorReporter.getInstance(config.baseUrl);
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.config.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let responseText = '';

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        ...options,
        headers,
      });

      responseText = await response.text();

      if (!response.ok) {
        const error = new HTTPError(response.status, responseText);
        this.errorReporter.report(error, {
          apiEndpoint: path,
          apiMethod: options.method || 'GET',
          statusCode: response.status,
          requestData: options.body ? JSON.parse(options.body as string) : undefined,
          responseData: responseText
        });
        throw error;
      }

      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      if (error instanceof HTTPError) {
        throw error;
      }

      const debugError = error instanceof Error ? error : new Error(String(error));
      this.errorReporter.report(debugError, {
        apiEndpoint: path,
        apiMethod: options.method || 'GET',
        requestData: options.body ? JSON.parse(options.body as string) : undefined,
        responseData: responseText
      });

      throw new HTTPError(500, 'An unexpected error occurred');
    }
  }

  // Wrap all API methods with try-catch to ensure errors are reported

  async createEvent(request: CreateEventRequest): Promise<ApiEvent> {
    const response = await this.fetch<CreateEventResponse>('/api/events/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.event!;
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const token = await this.config.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${this.config.baseUrl}/api/events/${id}`, {
        method: 'DELETE',
        headers,
      });

      const responseText = await response.text();

      if (!response.ok) {
        const error = new HTTPError(response.status, responseText);
        this.errorReporter.report(error, {
          apiEndpoint: `/api/events/${id}`,
          apiMethod: 'DELETE',
          statusCode: response.status,
          responseData: responseText
        });
        throw error;
      }
    } catch (error) {
      if (!(error instanceof HTTPError)) {
        const debugError = error instanceof Error ? error : new Error(String(error));
        this.errorReporter.report(debugError, {
          apiEndpoint: `/api/events/${id}`,
          apiMethod: 'DELETE'
        });
        throw new HTTPError(500, 'An unexpected error occurred during deletion');
      }
      throw error;
    }
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
    return await this.fetch<ListEventsResponse>('/api/events/');
  }

  async listLocations(): Promise<ApiLocation[]> {
    const response = await this.fetch<ListLocationsResponse>('/api/locations/');
    return response.locations || [];
  }

  async listPublicEvents(): Promise<ListEventsResponse> {
    return await this.fetch<ListEventsResponse>('/api/events/public');
  }

  async getPublicEvent(id: string): Promise<ApiEvent> {
    const response = await this.fetch<GetEventResponse>(`/api/events/public/${id}`);
    return response.event!;
  }

  async listJoinedEvents(): Promise<ListEventsResponse> {
    return await this.fetch<ListEventsResponse>('/api/events/joined');
  }

  async joinEvent(eventId: string, request: JoinEventRequest): Promise<ApiJoinRequest> {
    const response = await this.fetch<JoinRequestResponse>(`/api/events/public/${eventId}/joins`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.joinRequest!;
  }

  async cancelJoinRequest(eventId: string, joinRequestId: string): Promise<void> {
    await this.fetch(`/api/events/public/${eventId}/joins/${joinRequestId}`, {
      method: 'DELETE'
    });
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
    return await this.fetch<GetUserProfileResponse>('/api/profiles/me');
  }

  async getUserProfileByUserId(userId: string): Promise<GetUserProfileResponse> {
    return await this.fetch<GetUserProfileResponse>(`/api/profiles/${userId}`);
  }

  async createUserProfile(request: CreateUserProfileRequest): Promise<CreateUserProfileResponse> {
    return await this.fetch<CreateUserProfileResponse>('/api/profiles/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateUserProfile(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    return await this.fetch<UpdateUserProfileResponse>('/api/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteUserProfile(): Promise<void> {
    await this.fetch<void>('/api/profiles/me', {
      method: 'DELETE',
    });
  }

  async ping(): Promise<{ service?: string; status?: string; message?: string }> {
    return this.fetch<{ service?: string; status?: string; message?: string }>('/ping');
  }

  // Calendar integration methods
  async getCalendarAuthURL(): Promise<CalendarAuthURLResponse> {
    return await this.fetch<CalendarAuthURLResponse>('/api/calendar/auth/url');
  }

  async handleCalendarCallback(request: CalendarCallbackRequest): Promise<void> {
    await this.fetch<void>('/api/calendar/auth/callback', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCalendarConnectionStatus(): Promise<CalendarConnectionStatusResponse> {
    return await this.fetch<CalendarConnectionStatusResponse>('/api/calendar/connection/status');
  }

  async disconnectCalendar(): Promise<void> {
    await this.fetch<void>('/api/calendar/connection', {
      method: 'DELETE',
    });
  }

  async getCalendarBusyTimes(request: CalendarBusyTimesRequest): Promise<CalendarBusyTimesResponse> {
    const params = new URLSearchParams({
      timeMin: request.timeMin,
      timeMax: request.timeMax,
    });
    return await this.fetch<CalendarBusyTimesResponse>(`/api/calendar/busy-times?${params}`);
  }

  async getCalendarPreferences(): Promise<CalendarPreferencesResponse> {
    return await this.fetch<CalendarPreferencesResponse>('/api/calendar/preferences');
  }

  async updateCalendarPreferences(request: CalendarPreferencesRequest): Promise<CalendarPreferencesResponse> {
    return await this.fetch<CalendarPreferencesResponse>('/api/calendar/preferences', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }
}