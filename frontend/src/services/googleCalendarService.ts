export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  description?: string;
}

export interface BlockedEvent {
  start: string;
  end: string;
  summary: string;
}

export interface GoogleCalendarConfig {
  baseUrl: string;
}

class GoogleCalendarService {
  private baseUrl: string;
  private isAuthenticated: boolean = false;

  constructor(config: GoogleCalendarConfig) {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Checks if the service is authenticated
   */
  isConnected(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Gets the authorization URL for OAuth flow
   * @returns Promise<string> - the authorization URL
   */
  async getAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/google-calendar/auth-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      throw error;
    }
  }

  /**
   * Exchanges authorization code for tokens
   * @param code - the authorization code from OAuth callback
   * @returns Promise<boolean> - true if successful
   */
  async exchangeCode(code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/google-calendar/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authCode: code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const data = await response.json();
      if (data.success) {
        this.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to exchange authorization code:', error);
      return false;
    }
  }

  /**
   * Fetches calendar events for a date range
   * @param startDate - start date for event search
   * @param endDate - end date for event search
   * @returns Promise<BlockedEvent[]> - array of blocked events
   */
  async getEvents(startDate: Date, endDate: Date): Promise<BlockedEvent[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please connect to Google Calendar first.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/google-calendar/blocked-events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      return data.events.map((event: any) => ({
        start: event.start,
        end: event.end,
        summary: event.summary,
      }));
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      return [];
    }
  }

  /**
   * Checks the connection status
   * @returns Promise<boolean> - true if connected
   */
  async checkConnectionStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/google-calendar/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.isAuthenticated = data.connected;
      return data.connected;
    } catch (error) {
      console.error('Failed to check connection status:', error);
      return false;
    }
  }

  /**
   * Disconnects from Google Calendar
   * @returns Promise<boolean> - true if successful
   */
  async disconnect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/google-calendar/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      this.isAuthenticated = false;
      return true;
    } catch (error) {
      console.error('Failed to disconnect:', error);
      return false;
    }
  }

  /**
   * Disconnects from Google Calendar (local state only)
   */
  disconnectLocal(): void {
    this.isAuthenticated = false;
  }
}

export default GoogleCalendarService;