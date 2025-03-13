import { 
  APIClient, 
  APIConfig, 
  CreateInvitationRequest, 
  InvitationResponse, 
  APIInvitation,
  AckInvitationRequest,
  AcceptanceOptions,
  ConfirmInvitationRequest
} from './types';
import { 
  Invitation, 
  ActivityType, 
  SingleDoubleType, 
  SkillLevel,
  InvitationStatus,
  AckStatus
} from '../domain/invitation';
import { Area, Location, LocationResponse } from '../domain/locations';

class MockAPIError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'MockAPIError';
  }
}

const STORAGE_KEY = 'mock_invitations';

const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Central Park Tennis Center',
    area: Area.Central,
    address: '123 Central Park West',
    isActive: true,
    amenities: ['Lights', 'Pro Shop', 'Restrooms']
  },
  {
    id: '2',
    name: 'Riverside Tennis Club',
    area: Area.West,
    address: '456 Riverside Drive',
    isActive: true,
    amenities: ['Indoor Courts', 'Pro Shop', 'Locker Rooms']
  }
];

const DEFAULT_MOCK_INVITATIONS: APIInvitation[] = [
  {
    id: '1',
    ownerId: 'current_user',
    locations: ['1', '2'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: ActivityType.Match,
    requestType: SingleDoubleType.Single,
    sessionDuration: 1.5,
    timeSlots: [
      { date: new Date().toISOString(), time: 1430 },
      { date: new Date(Date.now() + 86400000).toISOString(), time: 1500 }
    ],
    description: 'Looking for a friendly match',
    status: InvitationStatus.Pending,
    createdAt: new Date().toISOString(),
    acks: []
  }
];

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private invitations: APIInvitation[] = this.loadInvitations();
  private locations: Location[] = MOCK_LOCATIONS;

  constructor(config: APIConfig) {
    this.config = config;
  }

  async getCurrentUserId(): Promise<string> {
    await this.checkAuth();
    await this.delay(500);
    return 'current_user';
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
      status: invitation.status,
      timeSlots: invitation.timeSlots.map(t => ({
        date: new Date(t.date),
        time: t.time
      })),
      createdAt: new Date(invitation.createdAt),
      acks: invitation.acks.map(ack => ({
        ...ack,
        timeSlots: ack.timeSlots.map(t => ({
          date: new Date(t.date),
          time: t.time
        })),
        createdAt: new Date(ack.createdAt)
      })),
      reservation: invitation.reservation ? {
        ...invitation.reservation,
        date: new Date(invitation.reservation.date),
        createdAt: new Date(invitation.reservation.createdAt)
      } : undefined
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
      sessionDuration: request.sessionDuration,
      timeSlots: request.timeSlots.map(t => ({
        date: t.date.toISOString(),
        time: t.time
      })),
      description: request.description,
      status: InvitationStatus.Pending,
      createdAt: new Date().toISOString(),
      acks: []
    };

    this.invitations.push(invitation);
    this.saveInvitations();
    return this.toDomainInvitation(invitation);
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
      filtered = filtered.filter(inv => inv.ownerId === 'current_user');
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

    return {
      locations: invitation.locations,
      timeSlots: invitation.timeSlots.map(t => ({
        ...t,
        isAvailable: true
      }))
    };
  }

  async ackInvitation(request: AckInvitationRequest): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === request.invitationId);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Pending) {
      throw new MockAPIError('INVALID_STATUS', 'Invitation cannot be accepted');
    }

    invitation.acks.push({
      userId: 'current_user',
      locations: request.locations,
      timeSlots: request.timeSlots.map(t => ({
        date: t.date.toISOString(),
        time: t.time
      })),
      status: AckStatus.Pending,
      comment: request.comment,
      createdAt: new Date().toISOString()
    });

    this.saveInvitations();
  }

  async confirmInvitation(request: ConfirmInvitationRequest): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === request.invitationId);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.status !== InvitationStatus.Accepted) {
      throw new MockAPIError('INVALID_STATUS', 'Invitation cannot be confirmed');
    }

    if (invitation.ownerId !== 'current_user') {
      throw new MockAPIError('FORBIDDEN', 'Only the invitation owner can confirm the session');
    }

    invitation.status = InvitationStatus.Confirmed;
    invitation.reservation = {
      location: request.location,
      date: request.date.toISOString(),
      time: request.time,
      duration: request.duration,
      playerBId: request.playerBId,
      createdAt: new Date().toISOString()
    };

    // Update the ack status
    const playerBAck = invitation.acks.find(ack => ack.userId === request.playerBId);
    if (playerBAck) {
      playerBAck.status = AckStatus.Accepted;
    }

    this.saveInvitations();
  }

  async cancelInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    if (invitation.ownerId !== 'current_user') {
      throw new MockAPIError('FORBIDDEN', 'Only the invitation owner can cancel it');
    }

    invitation.status = InvitationStatus.Cancelled;
    this.saveInvitations();
  }

  async cancelAck(invitationId: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    const ack = invitation.acks.find(a => a.userId === 'current_user');
    if (!ack) {
      throw new MockAPIError('NOT_FOUND', 'Acknowledgment not found');
    }

    ack.status = AckStatus.Cancelled;
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