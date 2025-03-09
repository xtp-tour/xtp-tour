import { APIClient, APIConfig, CreateInvitationRequest, UpdateInvitationRequest, InvitationResponse } from '../types/api';
import { Invitation, InvitationType, RequestType, SkillLevel } from '../types/invitation';
import { Area, Location, LocationResponse } from '../types/locations';

class MockAPIError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'MockAPIError';
  }
}

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

const MOCK_INVITATIONS: Invitation[] = [
  {
    id: '1',
    playerId: 'user_1',
    locations: ['central_park'],
    skillLevel: SkillLevel.Intermediate,
    invitationType: InvitationType.Match,
    requestType: RequestType.Single,
    matchDuration: 2,
    dates: [
      {
        date: new Date('2024-03-20'),
        timespan: { from: 1000, to: 1200 }
      }
    ],
    description: 'Looking for a friendly match',
    isOwner: true,
    createdAt: new Date(),
  }
];

export class MockAPIClient implements APIClient {
  private config: APIConfig;
  private invitations: Invitation[] = [...MOCK_INVITATIONS];
  private locations: Location[] = [...MOCK_LOCATIONS];

  constructor(config: APIConfig) {
    this.config = config;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkAuth(): Promise<void> {
    const token = await this.config.getAuthToken();
    if (!token) {
      throw new MockAPIError('UNAUTHORIZED', 'Authentication required');
    }
  }

  async createInvitation(request: CreateInvitationRequest): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const invitation: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      playerId: 'current_user',
      locations: request.locations,
      skillLevel: request.skillLevel as SkillLevel,
      invitationType: request.invitationType as InvitationType,
      requestType: request.requestType as RequestType,
      matchDuration: request.matchDuration,
      dates: request.dates.map(d => ({
        date: new Date(d.date),
        timespan: d.timespan
      })),
      description: request.description,
      isOwner: true,
      createdAt: new Date(),
    };

    this.invitations.push(invitation);
    return invitation;
  }

  async updateInvitation(request: UpdateInvitationRequest): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.invitations.findIndex(inv => inv.id === request.id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    const invitation = this.invitations[index];
    const updated: Invitation = {
      ...invitation,
      ...request,
      skillLevel: (request.skillLevel as SkillLevel) || invitation.skillLevel,
      invitationType: (request.invitationType as InvitationType) || invitation.invitationType,
      requestType: (request.requestType as RequestType) || invitation.requestType,
      dates: request.dates ? request.dates.map(d => ({
        date: new Date(d.date),
        timespan: d.timespan
      })) : invitation.dates,
      updatedAt: new Date()
    };

    this.invitations[index] = updated;
    return updated;
  }

  async deleteInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const index = this.invitations.findIndex(inv => inv.id === id);
    if (index === -1) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    this.invitations.splice(index, 1);
  }

  async getInvitation(id: string): Promise<Invitation> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new MockAPIError('NOT_FOUND', 'Invitation not found');
    }

    return invitation;
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

  async acceptInvitation(id: string): Promise<void> {
    await this.checkAuth();
    await this.delay(500);

    const invitation = await this.getInvitation(id);
    if (invitation.isOwner) {
      throw new MockAPIError('INVALID_OPERATION', 'Cannot accept own invitation');
    }

    // In real implementation, this would create a match or handle the acceptance
    console.log('Invitation accepted:', id);
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