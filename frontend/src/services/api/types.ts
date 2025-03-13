import { Location, LocationResponse } from '../domain/locations';
import { Invitation, ActivityType, SingleDoubleType, SkillLevel, Acks, Reservation } from '../domain/invitation';

export interface CreateInvitationRequest {
  locations: string[];
  skillLevel: SkillLevel;
  sessionDuration: number;
  invitationType: ActivityType;
  requestType: SingleDoubleType;
  description?: string;
  timeSlots: {
    date: Date;
    time: number;
  }[];
}

export interface AckInvitationRequest {
  invitationId: string;
  locations: string[];
  timeSlots: {
    date: Date;
    time: number;
  }[];
  comment?: string;
}

export interface ConfirmInvitationRequest {
  invitationId: string;
  location: string;
  date: Date;
  time: number;
  duration: number;
  playerBId: string;
}

export interface APIInvitation extends Omit<Invitation, 'timeSlots' | 'createdAt' | 'acks' | 'reservation'> {
  timeSlots: {
    date: string;
    time: number;
  }[];
  createdAt: string;
  acks: (Omit<Acks, 'createdAt' | 'timeSlots'> & { 
    createdAt: string;
    timeSlots: {
      date: string;
      time: number;
    }[];
  })[];
  reservation?: Omit<Reservation, 'createdAt' | 'date'> & {
    date: string;
    createdAt: string;
  };
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
  // Auth endpoints
  getCurrentUserId(): Promise<string>;

  // Invitation endpoints
  createInvitation(request: CreateInvitationRequest): Promise<Invitation>;
  deleteInvitation(id: string): Promise<void>;
  getInvitation(id: string): Promise<Invitation>;
  listInvitations(params?: {
    page?: number;
    limit?: number;
    ownOnly?: boolean;
  }): Promise<InvitationResponse>;
  getAcceptanceOptions(id: string): Promise<AcceptanceOptions>;
  ackInvitation(request: AckInvitationRequest): Promise<void>;
  confirmInvitation(request: ConfirmInvitationRequest): Promise<void>;
  cancelInvitation(id: string): Promise<void>;
  cancelAck(invitationId: string): Promise<void>;
  
  // Location endpoints
  getLocation(id: string): Promise<Location>;
  listLocations(params?: {
    page?: number;
    limit?: number;
    area?: string;
    search?: string;
  }): Promise<LocationResponse>;
}
