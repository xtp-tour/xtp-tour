import { Location, LocationResponse } from './locations';
import { Invitation, InvitationType, RequestType, SkillLevel } from './invitation';

export interface CreateInvitationRequest {
  locations: string[];
  skillLevel: SkillLevel;
  matchDuration: number;
  invitationType: InvitationType;
  requestType: RequestType;
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

export interface AcceptInvitationRequest {
  id: string;
  selectedLocations: string[];
  selectedTimeSlots: {
    date: string;
    startTime: number; // in HHMM format
  }[];
}

export interface APIInvitation extends Omit<Invitation, 'dates' | 'createdAt' | 'updatedAt'> {
  dates: {
    date: string;
    timespan: {
      from: number;
      to: number;
    };
  }[];
  createdAt: string;
  updatedAt?: string;
  selectedLocations?: string[];
  selectedTimeSlots?: {
    date: string;
    startTime: number;
  }[];
}

export interface InvitationResponse {
  invitations: APIInvitation[];
  total: number;
}

export interface TimeSlotOption {
  date: string;
  time: number;
  isAvailable: boolean;
}

export interface AcceptanceOptions {
  locations: string[];
  timeSlots: TimeSlotOption[];
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
  getAcceptanceOptions(id: string): Promise<AcceptanceOptions>;
  acceptInvitation(request: AcceptInvitationRequest): Promise<void>;
  
  // Location endpoints
  getLocation(id: string): Promise<Location>;
  listLocations(params?: {
    page?: number;
    limit?: number;
    area?: string;
    search?: string;
  }): Promise<LocationResponse>;
}
