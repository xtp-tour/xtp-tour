import { 
  APIClient, 
  APIConfig,  
  ListEventsResponse, 
  APIInvitation,
  joinEventRequest,
  AcceptanceOptions,
  TimeSlotOption
} from '../types/api';
import { 
  Event, 
  EventType,
  SkillLevel,
  EventStatus,
  EventConfirmation, 
  JoinRequestStatus
} from '../types/event';
import { Location, LocationResponse } from '../types/locations';

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
  },
  {
    id: 'riverside',
    name: 'Riverside Tennis Center',    
    address: '456 Riverside Dr',    
  },
  {
    id: 'east_side',
    name: 'East Side Tennis Club',  
    address: '789 East End Ave',    
  },
];

// Helper function to create dates for the next 7 days
const getNextWeekDates = () => {
  const dates = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const nextWeekDates = getNextWeekDates();

const MOCK_MY_INVITATIONS: Event[] = [
  {
    id: '1',
    ownerId: 'current_user',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: EventType.Match,
    expectedPlayers: 2,
    sessionDuration: 2,
    timeSlots: [
      {
        date: new Date(nextWeekDates[0]),
        time: 1000
      },
      {
        date: new Date(nextWeekDates[0]),
        time: 1200
      }
    ],
    description: 'Accepted Invitation. Looking for a friendly match, prefer baseline rallies',
    status: EventStatus.Open,
    createdAt: new Date(),
    joinRequests: [
      {
        userId: 'other_user',
        locations: ['central_park'],
        timeSlots: [{
          date: new Date(nextWeekDates[0]),
          time: 1000
        }],
        status: JoinRequestStatus.Waiting,
        createdAt: new Date()
      },
      {
        userId: 'john_doe',
        locations: ['riverside'],
        timeSlots: [{
          date: new Date(nextWeekDates[0]),
          time: 1000
        }],
        status: JoinRequestStatus.Waiting,
        createdAt: new Date()
      },
    ]
  },
  {
    id: '2',
    ownerId: 'current_user',
    locations: ['riverside'],
    skillLevel: SkillLevel.Advanced,
    invitationType: EventType.Training,
    expectedPlayers: 2,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 800
      }
    ],
    description: 'Want to practice serves and returns',
    status: EventStatus.Open,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    joinRequests: []
  },
];

const MOCK_OTHER_INVITATIONS: Event[] = [
  {
    id: '3',
    ownerId: 'john_doe',
    locations: ['east_side'],
    skillLevel: SkillLevel.Beginner,
    invitationType: EventType.Training,
    expectedPlayers: 2,
    sessionDuration: 1,
    timeSlots: [
      {
        date: new Date(nextWeekDates[1]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      }
    ],
    description: 'New to tennis, looking for someone to practice basic strokes with',
    status: EventStatus.Open,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    joinRequests: []
  },
  {
    id: '4',
    ownerId: 'sarah_smith',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: EventType.Match,
    expectedPlayers: 4,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      }
    ],
    description: 'Looking for competitive matches, NTRP 4.0',
    status: EventStatus.Open,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    joinRequests: []
  },
  {
    id: '5',
    ownerId: 'Roger Federer',
    locations: ['central_park', 'riverside', 'east_side', 'west_side', 'north_side', 'south_side'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: EventType.Match,
    expectedPlayers: 4,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 1900
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 2000
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 2100
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 1900
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 2000
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 2100
      },
      {
        date: new Date(nextWeekDates[6]),
        time: 2200
      },
      {
        date: new Date(nextWeekDates[6]),
        time: 2300
      }
    ],
    description: 'Looking for competitive matches, NTRP 4.0',
    status: EventStatus.Open,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    joinRequests: []
  },
  

  // invitation that was accepted by the user
  {
    id: '5',
    ownerId: 'sonia_parker',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: EventType.Match,
    expectedPlayers: 4,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 1900
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 2000
      },
      {
        date: new Date(nextWeekDates[4]),
        time: 2100
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 1800
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 1900
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 2000
      },
      {
        date: new Date(nextWeekDates[5]),
        time: 2100
      },
      {
        date: new Date(nextWeekDates[6]),
        time: 2200
      },
      {
        date: new Date(nextWeekDates[6]),
        time: 2300
      }
      
    ],
    description: 'Invitation that I accepted.  Looking for competitive matches, NTRP 4.0',
    status: EventStatus.Open,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    joinRequests: [
      {
        userId: 'current_user',
        locations: [ 'riverside'],
        timeSlots: [{
          date: new Date(nextWeekDates[2]),
          time: 1600
        }],
        status: JoinRequestStatus.Accepted,
        createdAt: new Date()
      }
    ]
  }
];

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private myInvitations: Event[];
  private otherInvitations: Event[];
  private locations: Location[] = [...MOCK_LOCATIONS];

  constructor(config: APIConfig) {
    this.config = config;
    this.myInvitations = MOCK_MY_INVITATIONS;
    this.otherInvitations = MOCK_OTHER_INVITATIONS;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  private saveInvitations(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.myInvitations));
    } catch (error) {
      console.warn('Failed to save invitations to localStorage:', error);
    }
  }

  private async checkAuth(): Promise<void> {
    const token = await this.config.getAuthToken();
    if (!token) {
      throw new MockAPIError('UNAUTHORIZED', 'Authentication required');
    }
  }

  private toAPIInvitation(invitation: Event): APIInvitation {
    return {
      ...invitation,
      timeSlots: invitation.timeSlots.map(ts => ({
        date: ts.date.toISOString().split('T')[0],
        time: ts.time
      })),
      createdAt: invitation.createdAt.toISOString()
    };
  }

  async createEvent(request: Event): Promise<Event> {   
    await this.checkAuth();
    await this.delay(500);
    this.myInvitations.push(request);
    return request;
  }

  async confirmEvent(request: EventConfirmation): Promise<Event> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.myInvitations.find(inv => inv.id === request.invitationId);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== EventStatus.Accepted) {
      throw new MockAPIError('INVALID_STATE', 'Invitation must be in Accepted state to confirm');
    }

    const updatedInvitation = {
      ...invitation,
      status: EventStatus.Confirmed,
      reservation: request
    };

    const index = this.myInvitations.findIndex(inv => inv.id === request.invitationId);
    this.myInvitations[index] = updatedInvitation;
    this.saveInvitations();

    return updatedInvitation;
  }

  async listMyEvents(): Promise<ListEventsResponse> {
    await this.checkAuth();
    await this.delay(500);

    return {
      invitations: this.myInvitations.map(inv => this.toAPIInvitation(inv)),
      total: this.myInvitations.length
    };
  }

  async listEvents(): Promise<ListEventsResponse> {
    // Remove authentication check for listing invitations
    await this.delay(500);

    return {
      invitations: this.otherInvitations.map(inv => this.toAPIInvitation(inv)),
      total: this.otherInvitations.length
    };
  }

  async getAcceptanceOptions(id: string): Promise<AcceptanceOptions> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.otherInvitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== EventStatus.Open) {
      throw new MockAPIError('INVALID_STATE', 'Invitation is not available for acceptance');
    }

    const timeSlots: TimeSlotOption[] = invitation.timeSlots.map(ts => ({
      date: ts.date.toISOString().split('T')[0],
      time: ts.time,
      isAvailable: true
    }));

    return {
      locations: invitation.locations,
      timeSlots
    };
  }

  async joinEvent(request: joinEventRequest): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.otherInvitations.findIndex(inv => inv.id === request.id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    const invitation = this.otherInvitations[index];

    if (invitation.status !== EventStatus.Open) {
      throw new MockAPIError('INVALID_STATE', 'Invitation is not in pending state');
    }

    // Update the invitation
    this.otherInvitations[index] = {
      ...invitation,
      status: EventStatus.Accepted
    };
    
    this.saveInvitations();
  }

  async deleteEvent(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.myInvitations.findIndex(inv => inv.id === id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    this.myInvitations.splice(index, 1);
    this.saveInvitations();
  }

  async getEvent(id: string): Promise<Event> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.myInvitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    return invitation;
  }


  async getLocation(id: string): Promise<Location> {
    await this.delay(500);

    const location = this.locations.find(loc => loc.id === id);
    if (!location) {
      throw new MockAPIError('NOT_FOUND', 'Location not found');
    }

    return location;
  }

  async listLocations(params?: { page?: number; limit?: number; area?: string; search?: string; }): Promise<LocationResponse> {
    await this.delay(500);

    let filtered = this.locations;
    if (params?.area) {
      filtered = filtered.filter(loc => loc.area === params.area);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(search) || 
        loc.address?.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      locations: filtered.slice(start, end),
      total: filtered.length
    };
  }
} 