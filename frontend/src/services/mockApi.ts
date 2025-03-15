import { 
  APIClient, 
  APIConfig,  
  InvitationsResponse, 
  APIInvitation,
  AcceptInvitationRequest,
  AcceptanceOptions,
  TimeSlotOption
} from '../types/api';
import { 
  Invitation, 
  ActivityType,
  SingleDoubleType,
  SkillLevel,
  InvitationStatus,
  Reservation, 
  AckStatus
} from '../types/invitation';
import { Area, Location, LocationResponse } from '../types/locations';

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
    area: Area.Central,
    address: '123 Central Park West',
    isActive: true,
  },
  {
    id: 'riverside',
    name: 'Riverside Tennis Center',
    area: Area.West,
    address: '456 Riverside Dr',
    isActive: true,
  },
  {
    id: 'east_side',
    name: 'East Side Tennis Club',
    area: Area.East,
    address: '789 East End Ave',
    isActive: true,
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

const MOCK_MY_INVITATIONS: Invitation[] = [
  {
    id: '1',
    ownerId: 'current_user',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
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
    status: InvitationStatus.Pending,
    createdAt: new Date(),
    acks: [
      {
        userId: 'other_user',
        locations: ['central_park'],
        timeSlots: [{
          date: new Date(nextWeekDates[0]),
          time: 1000
        }],
        status: AckStatus.Pending,
        createdAt: new Date()
      },
      {
        userId: 'john_doe',
        locations: ['riverside'],
        timeSlots: [{
          date: new Date(nextWeekDates[0]),
          time: 1000
        }],
        status: AckStatus.Pending,
        createdAt: new Date()
      },
    ]
  },
  {
    id: '2',
    ownerId: 'current_user',
    locations: ['riverside'],
    skillLevel: SkillLevel.Advanced,
    invitationType: ActivityType.Training,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 800
      }
    ],
    description: 'Want to practice serves and returns',
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    acks: []
  },
];

const MOCK_OTHER_INVITATIONS: Invitation[] = [
  {
    id: '3',
    ownerId: 'john_doe',
    locations: ['east_side'],
    skillLevel: SkillLevel.Beginner,
    invitationType: ActivityType.Training,
    requestType: SingleDoubleType.Single,
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
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    acks: []
  },
  {
    id: '4',
    ownerId: 'sarah_smith',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      }
    ],
    description: 'Looking for competitive matches, NTRP 4.0',
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    acks: []
  },

  // invitation that was accepted by the user
  {
    id: '5',
    ownerId: 'sonia_parker',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    timeSlots: [
      {
        date: new Date(nextWeekDates[2]),
        time: 1600
      },
      {
        date: new Date(nextWeekDates[3]),
        time: 1800
      }
    ],
    description: 'Invitation that I accepted.  Looking for competitive matches, NTRP 4.0',
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    acks: [
      {
        userId: 'current_user',
        locations: [ 'riverside'],
        timeSlots: [{
          date: new Date(nextWeekDates[2]),
          time: 1600
        }],
        status: AckStatus.Accepted,
        createdAt: new Date()
      }
    ]
  }
];

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private myInvitations: Invitation[];
  private otherInvitations: Invitation[];
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

  private toAPIInvitation(invitation: Invitation): APIInvitation {
    return {
      ...invitation,
      timeSlots: invitation.timeSlots.map(ts => ({
        date: ts.date.toISOString().split('T')[0],
        time: ts.time
      })),
      createdAt: invitation.createdAt.toISOString()
    };
  }

  async createInvitation(request: Invitation): Promise<Invitation> {   
    await this.checkAuth();
    await this.delay(500);
    this.myInvitations.push(request);
    return request;
  }

  async confirmInvitation(request: Reservation): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.myInvitations.find(inv => inv.id === request.invitationId);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Accepted) {
      throw new MockAPIError('INVALID_STATE', 'Invitation must be in Accepted state to confirm');
    }

    const updatedInvitation = {
      ...invitation,
      status: InvitationStatus.Confirmed,
      reservation: request
    };

    const index = this.myInvitations.findIndex(inv => inv.id === request.invitationId);
    this.myInvitations[index] = updatedInvitation;
    this.saveInvitations();

    return updatedInvitation;
  }

  async listMyInvitations(): Promise<InvitationsResponse> {
    await this.checkAuth();
    await this.delay(500);

    return {
      invitations: this.myInvitations.map(inv => this.toAPIInvitation(inv)),
      total: this.myInvitations.length
    };
  }

  async listInvitations(): Promise<InvitationsResponse> {
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

    if (invitation.status !== InvitationStatus.Pending) {
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

  async acceptInvitation(request: AcceptInvitationRequest): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.otherInvitations.findIndex(inv => inv.id === request.id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    const invitation = this.otherInvitations[index];

    if (invitation.status !== InvitationStatus.Pending) {
      throw new MockAPIError('INVALID_STATE', 'Invitation is not in pending state');
    }

    // Update the invitation
    this.otherInvitations[index] = {
      ...invitation,
      status: InvitationStatus.Accepted
    };
    
    this.saveInvitations();
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.myInvitations.findIndex(inv => inv.id === id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    this.myInvitations.splice(index, 1);
    this.saveInvitations();
  }

  async getInvitation(id: string): Promise<Invitation> {
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