import { 
  APIClient, 
  APIConfig, 
  CreateInvitationRequest, 
  UpdateInvitationRequest, 
  InvitationResponse, 
  APIInvitation,
  AcceptInvitationRequest,
  AcceptanceOptions,
  TimeSlotOption
} from './types';
import { 
  Invitation, 
  ActivityType, 
  SingleDoubleType, 
  SkillLevel,
  InvitationStatus 
} from '../domain/invitation';
import { Area, Location, LocationResponse } from '../domain/locations';

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

const DEFAULT_MOCK_INVITATIONS: APIInvitation[] = [
  // My invitations
  {
    id: '1',
    ownerId: 'current_user',
    locations: ['central_park'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 2,
    dates: [
      {
        date: nextWeekDates[0],
        timespan: { from: 1000, to: 1200 }
      },
      {
        date: nextWeekDates[1],
        timespan: { from: 1400, to: 1600 }
      }
    ],
    description: 'Looking for a friendly match, prefer baseline rallies',
    isOwner: true,
    status: InvitationStatus.Pending,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    ownerId: 'current_user',
    locations: ['riverside'],
    skillLevel: SkillLevel.Advanced,
    invitationType: ActivityType.Training,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    dates: [
      {
        date: nextWeekDates[2],
        timespan: { from: 800, to: 930 }
      }
    ],
    description: 'Want to practice serves and returns',
    isOwner: true,
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },

  // Available invitations
  {
    id: '3',
    ownerId: 'john_doe',
    locations: ['east_side'],
    skillLevel: SkillLevel.Beginner,
    invitationType: ActivityType.Training,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1,
    dates: [
      {
        date: nextWeekDates[1],
        timespan: { from: 1800, to: 2300 }
      },
      {
        date: nextWeekDates[3],
        timespan: { from: 1800, to: 2200 }
      }
    ],
    description: 'New to tennis, looking for someone to practice basic strokes with',
    isOwner: false,
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '4',
    ownerId: 'sarah_smith',
    locations: ['central_park', 'riverside'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    dates: [
      {
        date: nextWeekDates[2],
        timespan: { from: 1600, to: 2230 }
      }
    ],
    description: 'Looking for competitive matches, NTRP 4.0',
    isOwner: false,
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: '5',
    ownerId: 'mike_wilson',
    locations: ['riverside'],
    skillLevel: SkillLevel.Advanced,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Doubles,
    sessionDuration: 2,
    dates: [
      {
        date: nextWeekDates[4],
        timespan: { from: 900, to: 1100 }
      },
      {
        date: nextWeekDates[5],
        timespan: { from: 900, to: 1100 }
      }
    ],
    description: 'Looking for doubles partners, NTRP 4.5+',
    isOwner: false,
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: '6',
    ownerId: 'emma_brown',
    locations: ['east_side'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Training,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1,
    dates: [
      {
        date: nextWeekDates[0],
        timespan: { from: 1900, to: 2000 }
      },
      {
        date: nextWeekDates[1],
        timespan: { from: 1900, to: 2000 }
      },
      {
        date: nextWeekDates[2],
        timespan: { from: 1900, to: 2000 }
      }
    ],
    description: 'Evening practice sessions, focusing on volleys and net play',
    isOwner: false,
    status: InvitationStatus.Pending,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
  // Example of an accepted invitation
  {
    id: '7',
    ownerId: 'alex_tennis',
    locations: ['central_park'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    dates: [
      {
        date: nextWeekDates[1],
        timespan: { from: 1600, to: 1730 }
      }
    ],
    description: 'Casual match with focus on consistent rallies',
    isOwner: false,
    status: InvitationStatus.Accepted,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  // Example of a confirmed invitation
  {
    id: '8',
    ownerId: 'current_user',
    locations: ['riverside'],
    skillLevel: SkillLevel.Advanced,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    dates: [
      {
        date: nextWeekDates[0],
        timespan: { from: 1400, to: 1600 }
      }
    ],
    description: 'Competitive match with an experienced player',
    isOwner: true,
    status: InvitationStatus.Confirmed,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    selectedLocations: ['riverside'],
    selectedTimeSlots: [{
      date: nextWeekDates[0],
      startTime: 1400
    }]
  }
];

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private invitations: APIInvitation[];
  private locations: Location[] = [...MOCK_LOCATIONS];

  constructor(config: APIConfig) {
    this.config = config;
    this.invitations = this.loadInvitations();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadInvitations(): APIInvitation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load invitations from localStorage:', error);
    }
    return [...DEFAULT_MOCK_INVITATIONS];
  }

  private saveInvitations(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.invitations));
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

  private toDomainInvitation(invitation: APIInvitation): Invitation {
    return {
      id: invitation.id,
      ownerId: invitation.ownerId,
      locations: invitation.locations,
      skillLevel: invitation.skillLevel,
      invitationType: invitation.invitationType,
      requestType: invitation.requestType,
      sessionDuration: invitation.sessionDuration,
      description: invitation.description,
      isOwner: invitation.isOwner,
      status: invitation.status,
      timeSlots: invitation.dates.map(d => ({
        ...d,
        date: new Date(d.date)
      })),
      createdAt: new Date(invitation.createdAt),
      updatedAt: invitation.updatedAt ? new Date(invitation.updatedAt) : undefined,
      selectedLocations: invitation.selectedLocations,
      selectedTimeSlots: invitation.selectedTimeSlots
    };
  }

  async createInvitation(request: CreateInvitationRequest): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const invitation: APIInvitation = {
      id: Math.random().toString(36).substr(2, 9),
      ownerId: 'current_user',
      locations: request.locations,
      skillLevel: request.skillLevel,
      invitationType: request.invitationType,
      requestType: request.requestType,
      sessionDuration: request.matchDuration,
      dates: request.dates,
      description: request.description,
      isOwner: true,
      status: InvitationStatus.Pending,
      createdAt: new Date().toISOString(),
    };

    this.invitations.push(invitation);
    this.saveInvitations();
    return this.toDomainInvitation(invitation);
  }

  async updateInvitation(request: UpdateInvitationRequest): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.invitations.findIndex(inv => inv.id === request.id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    const invitation = this.invitations[index];
    const updated: APIInvitation = {
      ...invitation,
      ...request,
      skillLevel: request.skillLevel || invitation.skillLevel,
      invitationType: request.invitationType || invitation.invitationType,
      requestType: request.requestType || invitation.requestType,
      dates: request.dates || invitation.dates,
      updatedAt: new Date().toISOString()
    };

    this.invitations[index] = updated;
    this.saveInvitations();
    return this.toDomainInvitation(updated);
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.invitations.findIndex(inv => inv.id === id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    this.invitations.splice(index, 1);
    this.saveInvitations();
  }

  async getInvitation(id: string): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    return this.toDomainInvitation(invitation);
  }

  async listInvitations(params?: { page?: number; limit?: number; ownOnly?: boolean; }): Promise<InvitationResponse> {
    await this.checkAuth();
    await this.delay(500);

    let filtered = this.invitations;
    if (params?.ownOnly) {
      filtered = filtered.filter(inv => inv.isOwner);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      invitations: filtered.slice(start, end),
      total: filtered.length
    };
  }

  private generateTimeSlots(date: string, from: number, to: number, duration: number): number[] {
    const slots: number[] = [];
    const step = 30; // 30-minute intervals
    let currentTime = from;

    // Convert duration to minutes (e.g., 1.5 hours = 90 minutes)
    const durationMinutes = duration * 60;
    
    // Helper function to convert HHMM format to minutes
    const toMinutes = (time: number) => {
      const hours = Math.floor(time / 100);
      const minutes = time % 100;
      return hours * 60 + minutes;
    };

    // Helper function to convert minutes to HHMM format
    const toHHMM = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours * 100 + mins;
    };

    while (true) {
      // Convert current time and end time to minutes for easier comparison
      const currentMinutes = toMinutes(currentTime);
      const endMinutes = toMinutes(to);
      
      // Check if there's enough time for a session
      if (currentMinutes + durationMinutes <= endMinutes) {
        slots.push(currentTime);
      } else {
        break;
      }

      // Increment by 30 minutes
      currentTime = toHHMM(currentMinutes + step);
    }

    return slots;
  }

  async getAcceptanceOptions(id: string): Promise<AcceptanceOptions> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Pending) {
      throw new MockAPIError('INVALID_STATE', 'Invitation is not available for acceptance');
    }

    // Generate all possible time slots based on the invitation's dates and duration
    const timeSlots: TimeSlotOption[] = invitation.dates.flatMap(dateSlot => {
      const slots = this.generateTimeSlots(
        dateSlot.date,
        dateSlot.timespan.from,
        dateSlot.timespan.to,
        invitation.sessionDuration
      );

      return slots.map(time => ({
        date: dateSlot.date,
        time,
        // TODO: Implement availability check against existing matches and user preferences
        isAvailable: true
      }));
    });

    return {
      locations: invitation.locations,
      timeSlots
    };
  }

  async acceptInvitation(request: AcceptInvitationRequest): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === request.id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Pending) {
      throw new MockAPIError('INVALID_STATUS', 'Invitation cannot be accepted');
    }

    invitation.status = InvitationStatus.Accepted;
    invitation.selectedLocations = request.selectedLocations;
    invitation.selectedTimeSlots = request.selectedTimeSlots;
    invitation.updatedAt = new Date().toISOString();

    this.saveInvitations();
  }

  async confirmInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Accepted) {
      throw new MockAPIError('INVALID_STATUS', 'Invitation cannot be confirmed');
    }

    if (!invitation.isOwner) {
      throw new MockAPIError('FORBIDDEN', 'Only the invitation owner can confirm the session');
    }

    invitation.status = InvitationStatus.Confirmed;
    invitation.updatedAt = new Date().toISOString();

    this.saveInvitations();
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