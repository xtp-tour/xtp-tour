import { Location, LocationResponse } from './locations';
import { Invitation } from './invitation';

export interface CreateInvitationRequest {
  locations: string[];
  skillLevel: string;
  matchDuration: number;
  invitationType: string;
  requestType: string;
  description?: string;
  dates: {
    date: string;
    timespan: {
      from: number;
      to: number;
    };
  }[];
}

export interface UpdateInvitationRequest extends Partial<CreateInvitationRequest> {
  id: string;
}

export interface InvitationResponse {
  invitations: Invitation[];
  total: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIConfig {
  baseUrl: string;
  getAuthToken(): Promise<string | undefined>;
}

export interface APIClient {
  // Invitation endpoints
  createInvitation(request: CreateInvitationRequest): Promise<Invitation>;
  updateInvitation(request: UpdateInvitationRequest): Promise<Invitation>;
  deleteInvitation(id: string): Promise<void>;
  getInvitation(id: string): Promise<Invitation>;
  listInvitations(params?: {
    page?: number;
    limit?: number;
    ownOnly?: boolean;
  }): Promise<InvitationResponse>;
  acceptInvitation(id: string): Promise<void>;
  
  // Location endpoints
  getLocation(id: string): Promise<Location>;
  listLocations(params?: {
    page?: number;
    limit?: number;
    area?: string;
    search?: string;
  }): Promise<LocationResponse>;
}
