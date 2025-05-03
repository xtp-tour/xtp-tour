import { APIConfig, ListEventsResponse } from '../types/api';
import { components } from '../types/schema';
import moment from 'moment';

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

class MockAPIError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'MockAPIError';
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
      moment().add(1, 'day').set({ hour: 10, minute: 0 }).toISOString(),
      moment().add(1, 'day').set({ hour: 14, minute: 0 }).toISOString()
    ],
    description: 'Accepted Invitation. Looking for a friendly match, prefer baseline rallies',
    status: 'OPEN',
    createdAt: moment().toISOString(),
    visibility: 'PUBLIC',
    joinRequests: [
      {
        id: '1',
        userId: 'other_user',
        locations: ['central_park'],
        timeSlots: [moment().add(1, 'day').set({ hour: 10, minute: 0 }).toISOString()],
        status: 'WAITING',
        createdAt: moment().toISOString()
      },
      {
        id: '2',
        userId: 'john_doe',
        locations: ['riverside'],
        timeSlots: [moment().add(1, 'day').set({ hour: 14, minute: 0 }).toISOString()],
        status: 'WAITING',
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
    joinRequests: []
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
  confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation>;
  listEvents(): Promise<ListEventsResponse>;
  listPublicEvents(): Promise<ListEventsResponse>;
  listJoinedEvents(): Promise<ListEventsResponse>;
  joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest>;

  // Location endpoints
  listLocations(): Promise<Location[]>;
}

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private myInvitations: Event[];
  private otherInvitations: Event[];
  private locations: Location[] = [...MOCK_LOCATIONS];
  private events: Event[] = [...MOCK_MY_INVITATIONS, ...MOCK_OTHER_INVITATIONS];

  constructor(config: APIConfig) {
    this.config = config;
    this.myInvitations = [...MOCK_MY_INVITATIONS];
    this.otherInvitations = [...MOCK_OTHER_INVITATIONS];
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
      throw new MockAPIError('UNAUTHORIZED', 'Authentication required');
    }
  }

  async createEvent(request: CreateEventRequest): Promise<Event> {
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
  }

  async confirmEvent(eventId: string, request: ConfirmEventRequest): Promise<EventConfirmation> {
    await this.checkAuth();
    await this.delay(500);

    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new MockAPIError('NOT_FOUND', 'Event not found');
    }

    const confirmation: EventConfirmation = {
      eventId,
      datetime: request.datetime,
      duration: request.duration,
      location: request.locationId,
      createdAt: moment().toISOString()
    };

    event.status = 'CONFIRMED';
    event.confirmation = confirmation;
    this.saveInvitations();

    return confirmation;
  }

  async listEvents(): Promise<ListEventsResponse> {
    await this.checkAuth();
    await this.delay(500);

    return {
      events: this.events,
      total: this.events.length
    };
  }

  async listPublicEvents(): Promise<ListEventsResponse> {
    await this.delay(500);

    const publicEvents = this.events.filter(event => event.visibility === 'PUBLIC' && event.status === 'OPEN');
    return {
      events: publicEvents,
      total: publicEvents.length
    };
  }

  async joinEvent(eventId: string, request: JoinEventRequest): Promise<JoinRequest> {
    await this.checkAuth();
    await this.delay(500);

    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new MockAPIError('NOT_FOUND', 'Event not found');
    }

    const joinRequest: JoinRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'current_user',
      ...request.joinRequest,
      status: 'WAITING',
      createdAt: new Date().toISOString()
    };

    if (!event.joinRequests) {
      event.joinRequests = [];
    }
    event.joinRequests.push(joinRequest);
    this.saveInvitations();

    return joinRequest;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    this.events = this.events.filter(e => e.id !== id);
    this.saveInvitations();
  }

  async getEvent(id: string): Promise<Event> {
    await this.checkAuth();
    await this.delay(500);

    const event = this.events.find(e => e.id === id);
    if (!event) {
      throw new MockAPIError('NOT_FOUND', 'Event not found');
    }

    return event;
  }

  async getPublicEvent(id: string): Promise<Event> {
    await this.delay(500);

    const event = this.events.find(e => e.id === id && e.visibility === 'PUBLIC');
    if (!event) {
      throw new MockAPIError('NOT_FOUND', 'Public event not found');
    }

    return event;
  }

  async listLocations(): Promise<Location[]> {
    await this.checkAuth();
    await this.delay(500);
    return this.locations;
  }

  async listJoinedEvents(): Promise<ListEventsResponse> {
    await this.checkAuth();
    await this.delay(500);

    // Find events where the current user has joined (has a join request)
    const joinedEvents = this.events.filter(event =>
      event.userId !== 'current_user' && // Not my own events
      event.joinRequests?.some(jr => jr.userId === 'current_user')
    );

    return {
      events: joinedEvents,
      total: joinedEvents.length
    };
  }
}